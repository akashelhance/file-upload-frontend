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
  TextField
} from "@mui/material";

import * as XLSX from "xlsx";
import axios from "axios";
import dayjs from "dayjs"

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
  const [fileType, setFileType]= useState("");


  const validateRow =(row)=>{

    let errors =[];


    if (row["Origin Port"] && !/^[A-Za-z\s]+$/.test(row["Origin Port"])) {
      errors.push(` "Origin Port" contains invalid characters.`);
    }
    if (row["Destination Port"] && !/^[A-Za-z\s]+$/.test(row["Destination Port"])) {
      errors.push(` "Destination Port" contains invalid characters.`);
    }
    if(row["Ocean Freight Rate"] && Number(row["Ocean Freight Rate"]) <= 0){
      errors.push(` "Ocean Freight Rate can not have negative values" `)
    }

    if (row["Effective Date"] && !dayjs(row["Effective Date"], "YYYY-MM-DD", true).isValid()) {
      errors.push(` "Effective Date" is not a valid `);
    }

    return errors.length ? errors.join(" ") : null;
  }

  const handleFileSelect = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;


    const fileExt = uploadedFile.name.split(".").pop().toLowerCase();
    setFileType(fileExt)



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

      const validatedData = sheetData.map((row)=>({
        ...row,
        error: validateRow({...row})
      }))

      setFile(uploadedFile);
      setColumns(fileColumns);
      setFileData(validatedData);
      setMissingColumns(missingCols);

      if (missingCols.length > 0) {
        setErrorMessage(`Missing required columns: ${missingCols.join(", ")}`);
      } else {
        setErrorMessage("");
      }
    };
  };

  // const handleDragEnd = (result) => {
  //   if (!result.destination) return;

  //   const newColumns = Array.from(columns);
  //   const [movedItem] = newColumns.splice(result.source.index, 1);
  //   newColumns.splice(result.destination.index, 0, movedItem);

  //   setColumns(newColumns);
  // };


  const handleEdit = async (rowIndex, column, value)=>{
      const updatedData = [...fileData];
      updatedData[rowIndex][column]=  value
      updatedData[rowIndex].error = validateRow(updatedData[rowIndex])
      setFileData(updatedData)
  }

  const handleSubmit = async () => {

    if(fileData.some((row)=> row.error)){
      setErrorMessage("Fix the Error before submit");
      return;
    }

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

    let blob;

    if(fileType === "csv"){
      const csvContent = [
        columns.join(","), 
        ...fileData.map((row)=> columns.map((col)=>row[col]).join(",")),
      ].join("\n")

      blob = new Blob([[csvContent], {type: "text/csv"}])
    }

    else{
      const worksheet = XLSX.utils.json_to_sheet(fileData.map(({error, ...row})=> row))
      console.log({worksheet})
      const workbook =XLSX.utils.book_new();
      console.log({workbook})
      XLSX.utils.book_append_sheet(workbook,worksheet, "New Correct Data")

      const excelBuffer = XLSX.write(workbook, {bookType: "xlsx", type: "array"});
      console.log({excelBuffer})
      blob = new Blob([[excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}])
    }
    let corrected_data;
    const formData = new FormData();
    formData.append(
      "file",
      new File([blob], fileType === "csv" ? corrected_data.csv : corrected_data.xlsx, {type: blob.type})
    )
    

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
         
         <TableContainer component={Paper}>
              <Table>
                <TableHead>
                <TableRow>
                        {columns.map((col, index) => (
                            <TableCell
                            key ={index}
                            sx={{ fontWeight: "bold", cursor: "grab", background: "#f5f5f5" }}
                          >
                            {col}
                          </TableCell>
                        ))}
                        <TableCell>Error....</TableCell>
                      </TableRow>
                </TableHead>
                <TableBody>
                  {fileData.slice(0, 10).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((col, colIndex) => (
                        <TableCell key={colIndex}>
                          <TextField
                            value={row[col] || ""}
                            onChange={(e)=> handleEdit(rowIndex, col, e.target.value)}
                            size="medium"
                          />
                        </TableCell>
                      ))}
                      <TableCell>{row.error}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
     
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{ mt: 2 }}
            disabled={fileData.some((row)=> row.error)}
          >
            Create and Submit new file
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
