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
        <Toolbar
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1, sm: 0 },
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              textAlign: { xs: "center", sm: "left" },
              mb: { xs: 1, sm: 0 },
            }}
          >
            📊 Survey Tool
          </Typography>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="inherit"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              width: { xs: "100%", sm: "auto" },
              justifyContent: { xs: "center", sm: "flex-end" },
            }}
          >
            <Tab label="Take Survey" value="take" />
            <Tab label="Manage Surveys" value="manage" />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 2, sm: 4 },
          px: { xs: 1, sm: 2 },
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: { xs: 1, sm: 2 },
          }}
        >
          {activeTab === "take" && <SurveyPage />}
          {activeTab === "manage" && <SurveyManagementPage />}
        </Paper>
      </Container>
    </Box>
  );
}
