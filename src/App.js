import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import DataTable from "./components/DataTable";
import { Container, Card, CardContent, Typography, Box } from "@mui/material";

function App() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);

  return (
    <Container maxWidth="md" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card sx={{ width: "100%", boxShadow: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
            CSV/Excel Upload
          </Typography>

          <FileUpload setData={setData} setColumns={setColumns} />

   
          {data.length > 0 && (
            <Box mt={4}>
              <DataTable data={data} columns={columns} setColumns={setColumns} />
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default App;
