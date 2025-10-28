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
    <Box className="container-main">
      <AppBar position="static" elevation={0} className="app-bar">
        <Toolbar className="toolbar toolbar-desktop">
          <Box className="nav-content-wrapper">
            <Typography
              variant="h4"
              component="div"
              className="nav-title floating title title-desktop"
            >
              📊 Survey Tool
            </Typography>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              textColor="inherit"
              variant="scrollable"
              scrollButtons={false}
              className="tabs-container tabs-container-desktop"
            >
              <Tab label="Take Survey" value="take" className="tab" />
              <Tab label="Manage Surveys" value="manage" className="tab" />
            </Tabs>
          </Box>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="lg"
        className="content-container content-container-desktop"
      >
        <Paper
          elevation={0}
          className="custom-card main-paper main-paper-desktop"
        >
          {activeTab === "take" && <SurveyPage />}
          {activeTab === "manage" && <SurveyManagementPage />}
        </Paper>
      </Container>
    </Box>
  );
}
