```jsx
return (
    <section className="max-w-5xl mx-auto bg-gradient-to-br from-white via-slate-50 to-purple-50 dark:from-darkBg dark:via-darkCard dark:to-darkCard rounded-2xl shadow-xl border border-slate-200 dark:border-darkAccent/30 p-8 space-y-8 transition-colors">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-darkText mb-2">Ventas</h2>
      <p className="text-base text-purple-700 dark:text-darkAccent font-semibold mb-6">Listado y gestión de ventas.</p>
      <div className="divide-y divide-slate-200 dark:divide-darkAccent/20 space-y-8">
        <div className="pt-0">
          <VentasTable ventas={ventas} customFields={customFields} />
        </div>
      </div>
    </section>
  );
```