/**
 * Aviso de cuentas de Google cuyo token dejó de valer. Sin esto, los widgets
 * simplemente se quedaban vacíos y parecía que la app estaba rota o que la
 * cuenta "se había salido sola" sin motivo.
 */
export default function ReconnectBanner({
  accounts,
}: {
  accounts: { label: string; email: string | null; name: string }[];
}) {
  if (accounts.length === 0) return null;

  return (
    <div className="border border-danger/40 bg-danger/10 rounded-lg p-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <p className="text-sm flex-1 min-w-[240px]">
        <span className="font-medium">
          {accounts.length === 1
            ? `La cuenta de Google ${accounts[0].name} necesita reconectarse`
            : "Hay cuentas de Google que necesitan reconectarse"}
        </span>
        <span className="text-muted">
          {" "}
          — su permiso caducó, así que sus widgets están vacíos hasta que la reconectes.
        </span>
      </p>
      <div className="flex items-center gap-2 shrink-0">
        {accounts.map((account) => (
          <a
            key={account.label}
            href={`/api/google/connect?label=${account.label}`}
            className="bg-accent text-background text-xs font-semibold rounded-lg px-3 py-1.5 hover:brightness-110"
          >
            Reconectar {account.name}
          </a>
        ))}
      </div>
    </div>
  );
}
