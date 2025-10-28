import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
  Chip,
  Divider,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useSurveyList, useDeleteSurvey } from "@/api/surveys";
import { SurveySummaryDto } from "@/types";
import SurveyViewDialog from "@/components/SurveyViewDialog";
import SurveyBuilderDialog from "@/components/SurveyBuilderDialog";

export default function SurveyManagementPage() {
  const { data: surveys, isLoading, isError } = useSurveyList();
  const deleteSurvey = useDeleteSurvey();
  const [selectedSurvey, setSelectedSurvey] = useState<SurveySummaryDto | null>(
    null
  );
  const [showBuilder, setShowBuilder] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const handleDelete = async (survey: SurveySummaryDto) => {
    setSelectedSurvey(survey);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (selectedSurvey) {
      await deleteSurvey.mutateAsync(selectedSurvey.id);
      setShowDeleteDialog(false);
      setSelectedSurvey(null);
    }
  };

  const handleEdit = (survey: SurveySummaryDto) => {
    setSelectedSurvey(survey);
    setShowBuilder(true);
  };

  const handleCreateNew = () => {
    setSelectedSurvey(null);
    setShowBuilder(true);
  };

  const handleView = (survey: SurveySummaryDto) => {
    setSelectedSurvey(survey);
    setShowViewDialog(true);
  };

  if (isLoading) return <CircularProgress />;
  if (isError) return <Alert severity="error">Failed to load surveys</Alert>;

  if (showBuilder) {
    return (
      <SurveyBuilderDialog
        key={selectedSurvey?.id || "new"} // Force remount when switching surveys
        surveyId={selectedSurvey?.id}
        onClose={() => {
          setShowBuilder(false);
          setSelectedSurvey(null);
        }}
      />
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        mb={3}
        gap={2}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            textAlign: { xs: "center", sm: "left" },
            mb: { xs: 0, sm: 1 },
          }}
        >
          Survey Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          sx={{
            borderRadius: 2,
            width: { xs: "100%", sm: "auto" },
            minWidth: { xs: "auto", sm: "200px" },
          }}
        >
          Create New Survey
        </Button>
      </Box>

      {surveys && surveys.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No surveys found
            </Typography>
            <Typography color="text.secondary" mb={3}>
              Create your first survey to get started
            </Typography>
            <Button variant="contained" onClick={handleCreateNew}>
              Create Survey
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {surveys?.map((survey) => (
            <Grid item xs={12} sm={6} md={6} lg={4} key={survey.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {survey.title}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    variant="body2"
                    gutterBottom
                  >
                    ID: {survey.id.slice(0, 8)}...
                  </Typography>
                  <Chip
                    label="Active"
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
                <Divider />
                <Box
                  p={2}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={1}
                >
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit(survey)}
                    title="Edit Survey"
                    size="small"
                    sx={{
                      flex: 1,
                      minWidth: "auto",
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    color="info"
                    title="View Survey"
                    onClick={() => handleView(survey)}
                    size="small"
                    sx={{
                      flex: 1,
                      minWidth: "auto",
                    }}
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(survey)}
                    title="Delete Survey"
                    size="small"
                    sx={{
                      flex: 1,
                      minWidth: "auto",
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Delete Survey</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedSurvey?.title}"? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            disabled={deleteSurvey.isPending}
          >
            {deleteSurvey.isPending ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showViewDialog}
        onClose={() => setShowViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Survey Details</DialogTitle>
        <DialogContent>
          {selectedSurvey && <SurveyViewDialog surveyId={selectedSurvey.id} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
