import React, { useState } from 'react';

const COLUMNS = [
  { key: 'targetName',   label: 'TARGET'          },
  { key: 'targetId',     label: 'TARGET ID'       },
  { key: 'action',       label: 'ACTION'          },
  { key: 'actionDate',   label: 'DATE TIME'       },
  { key: 'resultStatus', label: 'STATUS'          },
  { key: 'ipAddress',    label: 'IP ADDRESS'      },
  { key: 'updatedData',  label: 'NEW DATA'        },
  { key: 'previousData', label: 'OLD DATA'        },
  { key: 'modifyId',     label: 'MODIFIED BY ID'  },
  { key: 'modifyBy',     label: 'MODIFIED BY'     },
];

function TruncatedCell({ value }) {
  const [expanded, setExpanded] = useState(false);
  if (!value) return <span className="text-gray-300">—</span>;
  const short = String(value).length > 40;
  if (!short) return <span>{value}</span>;
  return (
    <span>
      {expanded ? value : String(value).slice(0, 40) + '…'}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="ml-1 text-blue-600 text-xs underline"
      >
        {expanded ? 'less' : 'more'}
      </button>
    </span>
  );
}

export default function Report12Table({ rows }) {
  if (!rows || rows.length === 0) {
    return <p className="text-center text-gray-400 py-10">No data found for the selected criteria.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-blue-800 text-white text-left">
            {COLUMNS.map((c) => (
              <th key={c.key} className="px-3 py-2 whitespace-nowrap font-medium border border-blue-700">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {COLUMNS.map((c) => (
                <td key={c.key} className="px-3 py-1.5 border border-gray-200 max-w-xs">
                  {c.key === 'resultStatus' ? (
                    <span
                      className={
                        row[c.key] === 'SUCCESS'
                          ? 'text-green-700 font-medium'
                          : 'text-red-600 font-medium'
                      }
                    >
                      {row[c.key] ?? ''}
                    </span>
                  ) : c.key === 'updatedData' || c.key === 'previousData' ? (
                    <TruncatedCell value={row[c.key]} />
                  ) : (
                    row[c.key] ?? ''
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
