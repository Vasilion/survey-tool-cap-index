import { useState } from "react";
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import SurveyPage from "@/pages/SurveyPage";
import SurveyManagementPage from "@/pages/SurveyManagementPage";
type TabValue = "take" | "manage";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabValue>("take");

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box
      sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "background.default" }}
    >
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            📊 Survey Tool
          </Typography>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="inherit"
          >
            <Tab label="Take Survey" value="take" />
            <Tab label="Manage Surveys" value="manage" />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          {activeTab === "take" && <SurveyPage />}
          {activeTab === "manage" && <SurveyManagementPage />}
        </Paper>
      </Container>
    </Box>
  );
}
