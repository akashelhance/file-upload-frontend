import React from "react";
import ColumnReorder from "./ColumnReorder";

const DataTable = ({ data, columns, setColumns }) => {
  return (
    <div>
      <h3>Preview Data</h3>
      <ColumnReorder columns={columns} setColumns={setColumns} />
      <table border="1">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, index) => (
            <tr key={index}>
              {columns.map((col) => (
                <td key={col}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
