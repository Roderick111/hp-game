interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-serif font-bold text-amber-900">
        {title}
      </h1>
      {subtitle && (
        <p className="text-amber-700 mt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}
