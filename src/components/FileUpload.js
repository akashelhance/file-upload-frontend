import React, { useState } from "react";
import {
  Button,
  Snackbar,
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import * as XLSX from "xlsx";
import axios from "axios";

const REQUIRED_COLUMNS = [
  "Origin Port",
  "Destination Port",
  "Container Type",
  "Ocean Freight Rate",
  "Carrier",
  "Effective Date",
];

const FileUpload = () => {
  const [fileData, setFileData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [file, setFile] = useState(null);
  const [missingColumns, setMissingColumns] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileSelect = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.readAsBinaryString(uploadedFile);

    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (!sheetData.length) {
        setErrorMessage("File is empty or invalid!");
        setFileData([]);
        setMissingColumns([]);
        return;
      }

      const fileColumns = Object.keys(sheetData[0]);

      const missingCols = REQUIRED_COLUMNS.filter(
        (col) => !fileColumns.includes(col)
      );

      setFile(uploadedFile);
      setColumns(fileColumns);
      setFileData(sheetData);
      setMissingColumns(missingCols);

      if (missingCols.length > 0) {
        setErrorMessage(`Missing required columns: ${missingCols.join(", ")}`);
      } else {
        setErrorMessage("");
      }
    };
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newColumns = Array.from(columns);
    const [movedItem] = newColumns.splice(result.source.index, 1);
    newColumns.splice(result.destination.index, 0, movedItem);

    setColumns(newColumns);
  };

  const handleSubmit = async () => {
    if (!file) {
      setErrorMessage("No file selected!");
      return;
    }

    if (missingColumns.length > 0) {
      setErrorMessage(
        `Cannot submit. Missing required columns: ${missingColumns.join(", ")}`
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/upload`, // calling from environment variable
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setSuccessMessage(response.data.message || "File uploaded successfully!");
      setFileData([]);
      setFile(null);
      setMissingColumns([]);
      setErrorMessage("");
    } catch (error) {
      console.error("Upload failed:", error);
      setErrorMessage("File upload failed. Please try again.");
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={2} width="90%">

      <Button variant="contained" component="label">
        Select File
        <input type="file" accept=".csv,.xlsx" hidden onChange={handleFileSelect} />
      </Button>


      {fileData.length > 0 && (
        <Box width="100%" mt={3}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <Droppable droppableId="columns" direction="horizontal">
                    {(provided) => (
                      <TableRow ref={provided.innerRef} {...provided.droppableProps}>
                        {columns.map((col, index) => (
                          <Draggable key={col} draggableId={col} index={index}>
                            {(provided) => (
                              <TableCell
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                ref={provided.innerRef}
                                sx={{ fontWeight: "bold", cursor: "grab", background: "#f5f5f5" }}
                              >
                                {col}
                              </TableCell>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </TableRow>
                    )}
                  </Droppable>
                </TableHead>
                <TableBody>
                  {fileData.slice(0, 5).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((col, colIndex) => (
                        <TableCell key={colIndex}>{row[col]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DragDropContext>

     
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{ mt: 2 }}
            disabled={missingColumns.length > 0}
          >
            Submit File
          </Button>


          {missingColumns.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Submission is disabled because the file is missing required columns:{" "}
              {missingColumns.join(", ")}
            </Alert>
          )}
        </Box>
      )}

  
      <Snackbar open={Boolean(successMessage)} autoHideDuration={3000} onClose={() => setSuccessMessage("")}>
        <Alert severity="success" onClose={() => setSuccessMessage("")}>{successMessage}</Alert>
      </Snackbar>


      <Snackbar open={Boolean(errorMessage)} autoHideDuration={5000} onClose={() => setErrorMessage("")}>
        <Alert severity="error" onClose={() => setErrorMessage("")}>{errorMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FileUpload;
