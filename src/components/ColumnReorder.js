import React from "react";
import { useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

const ColumnItem = ({ column, index, moveColumn }) => {
  const [, ref] = useDrag({
    type: "COLUMN",
    item: { index }
  });

  const [, drop] = useDrop({
    accept: "COLUMN",
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveColumn(draggedItem.index, index);
        draggedItem.index = index;
      }
    }
  });

  return (
    <th ref={(node) => ref(drop(node))} style={{ cursor: "grab" }}>
      {column}
    </th>
  );
};

const ColumnReorder = ({ columns, setColumns }) => {
  const moveColumn = (from, to) => {
    const updatedColumns = [...columns];
    const [movedColumn] = updatedColumns.splice(from, 1);
    updatedColumns.splice(to, 0, movedColumn);
    setColumns(updatedColumns);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <table border="1">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <ColumnItem key={col} column={col} index={index} moveColumn={moveColumn} />
            ))}
          </tr>
        </thead>
      </table>
    </DndProvider>
  );
};

export default ColumnReorder;
