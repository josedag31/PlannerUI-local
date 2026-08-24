use std::fs;
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::Duration;

use tauri::{Manager, RunEvent};

/// Windows a veces devuelve rutas con el prefijo `\\?\` (extended-length path).
/// Node.js no lo maneja bien como argumento de entrada (rompe la resolución de
/// módulos con EISDIR), así que se quita antes de pasarlo a `node.exe`.
fn simplify(path: &Path) -> PathBuf {
    let s = path.to_string_lossy();
    match s.strip_prefix(r"\\?\") {
        Some(rest) => PathBuf::from(rest),
        None => path.to_path_buf(),
    }
}

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

const SERVER_HOST: &str = "127.0.0.1";
const SERVER_PORT: u16 = 3000;

struct ServerProcess(Mutex<Option<Child>>);

fn wait_for_server(timeout: Duration) -> bool {
    let deadline = std::time::Instant::now() + timeout;
    while std::time::Instant::now() < deadline {
        if TcpStream::connect((SERVER_HOST, SERVER_PORT)).is_ok() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(200));
    }
    false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ServerProcess(Mutex::new(None)))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let resource_dir = simplify(&app.path().resource_dir()?);
            let app_data_dir = simplify(&app.path().app_data_dir()?);
            fs::create_dir_all(&app_data_dir)?;

            let db_path = app_data_dir.join("dev.db");
            if !db_path.exists() {
                let template = resource_dir.join("template.db");
                fs::copy(&template, &db_path)?;
            }

            let node_exe = resource_dir.join("node").join("node.exe");
            let server_js = resource_dir.join("app").join("server.js");
            let database_url = format!("file:{}", db_path.display());

            let log_path = app_data_dir.join("server.log");
            let stdout_log = fs::File::create(&log_path)?;
            let stderr_log = stdout_log.try_clone()?;

            fs::write(
                app_data_dir.join("launcher-debug.log"),
                format!(
                    "resource_dir={}\nnode_exe={} exists={}\nserver_js={} exists={}\ncwd={}\n",
                    resource_dir.display(),
                    node_exe.display(),
                    node_exe.exists(),
                    server_js.display(),
                    server_js.exists(),
                    resource_dir.join("app").display(),
                ),
            )?;

            let mut command = Command::new(&node_exe);
            command
                .arg(&server_js)
                .current_dir(resource_dir.join("app"))
                .env("DATABASE_URL", &database_url)
                .env("PORT", SERVER_PORT.to_string())
                .env("HOSTNAME", SERVER_HOST)
                .env("NODE_OPTIONS", "--use-system-ca")
                .env("NODE_ENV", "production")
                .stdout(stdout_log)
                .stderr(stderr_log);

            #[cfg(windows)]
            command.creation_flags(CREATE_NO_WINDOW);

            let child = command.spawn().expect("no se pudo arrancar el servidor interno");

            let state = app.state::<ServerProcess>();
            *state.0.lock().unwrap() = Some(child);

            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                let ready = wait_for_server(Duration::from_secs(20));
                if let Some(window) = app_handle.get_webview_window("main") {
                    if ready {
                        let _ = window
                            .eval(&format!("window.location.replace('http://{SERVER_HOST}:{SERVER_PORT}')"));
                    } else {
                        let _ = window.eval(
                            "document.write('No se pudo arrancar el servidor interno. Cierra e inténtalo de nuevo.')",
                        );
                    }
                    let _ = window.show();
                }
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let RunEvent::ExitRequested { .. } = event {
                let state = app_handle.state::<ServerProcess>();
                let taken = state.0.lock().unwrap().take();
                if let Some(mut child) = taken {
                    let _ = child.kill();
                    let _ = child.wait();
                }
            }
        });
}

#[cfg(windows)]
use std::os::windows::process::CommandExt;
