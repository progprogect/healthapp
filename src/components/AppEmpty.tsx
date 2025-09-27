interface AppEmptyProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: string;
  className?: string;
}

export default function AppEmpty({ 
  title = 'Пусто',
  message = 'Здесь пока ничего нет.',
  action,
  icon = '📭',
  className = ''
}: AppEmptyProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="text-6xl mb-4">{icon}</div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 text-center mb-6 max-w-md">{message}</p>
      
      {action && (
        <div>
          {action.href ? (
            <a
              href={action.href}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              {action.label}
            </a>
          ) : (
            <button
              onClick={action.onClick}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
