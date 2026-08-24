import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Empaquetado de escritorio (Tauri): build de Rust + build de Next copiado
    // como recurso, ninguno es código fuente del proyecto.
    "src-tauri/target/**",
    "src-tauri/resources/**",
  ]),
]);

export default eslintConfig;
