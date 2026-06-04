import React from 'react';

const COLUMNS = [
  { key: 'loginDatetime',   label: 'LOGIN DATETIME'    },
  { key: 'action',          label: 'ACTION'            },
  { key: 'actionDesc',      label: 'ACTION_DESC'       },
  { key: 'userName',        label: 'USER NAME'         },
  { key: 'groupName',       label: 'GROUP'             },
  { key: 'isAdministrator', label: 'ADMINISTRATOR'     },
  { key: 'firstname',       label: 'FIRSTNAME'         },
  { key: 'lastname',        label: 'LASTNAME'          },
  { key: 'clientIpAddress', label: 'CLIENT IP ADDRESS' },
  { key: 'clientName',      label: 'CLIENT NAME'       },
];

export default function Report11Table({ rows }) {
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
                <td key={c.key} className="px-3 py-1.5 border border-gray-200 whitespace-nowrap">
                  {/* Administrator: render "Y" or empty string — never null/undefined text */}
                  {c.key === 'isAdministrator'
                    ? (row[c.key] === 'Y' ? <span className="font-medium text-blue-700">Y</span> : '')
                    : (row[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
