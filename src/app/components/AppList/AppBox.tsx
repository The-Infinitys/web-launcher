type AppData = {
  name?: string;
  title?: string;
  description?: string;
  icon?: string;
  [k: string]: unknown;
};
type AppEntry = { id: string; data: AppData };

export default function AppBox({ info }: { info: AppEntry }) {
  const { id, data } = info;
  const name = data.name ?? data.title ?? id;
  const description = data.description ?? "";
  const icon = data.icon ?? "/icon.svg";

  return (
    <div className="flex items-center gap-4 p-4 border rounded bg-white/80 dark:bg-black/60">
      <img
        src={icon}
        alt={`${name} icon`}
        className="w-12 h-12 object-contain"
      />
      <div className="flex-1">
        <div className="font-semibold text-lg">{name}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
    </div>
  );
}
