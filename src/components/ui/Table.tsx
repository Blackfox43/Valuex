import React from "react";

export function Table({ className = "", children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className={`w-full text-left border-collapse text-slate-700 ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className = "", children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className = "", children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className = "", children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`hover:bg-slate-50 transition-colors duration-150 ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className = "", children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-2.5 text-left align-middle font-semibold ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className = "", children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-2.5 text-xs align-middle leading-snug ${className}`} {...props}>
      {children}
    </td>
  );
}
