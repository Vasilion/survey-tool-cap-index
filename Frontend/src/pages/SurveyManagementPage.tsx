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

  const handleDelete = async (survey: SurveySummaryDto): Promise<void> => {
    setSelectedSurvey(survey);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (selectedSurvey) {
      await deleteSurvey.mutateAsync(selectedSurvey.id);
      setShowDeleteDialog(false);
      setSelectedSurvey(null);
    }
  };

  const handleEdit = (survey: SurveySummaryDto): void => {
    setSelectedSurvey(survey);
    setShowBuilder(true);
  };

  const handleCreateNew = (): void => {
    setSelectedSurvey(null);
    setShowBuilder(true);
  };

  const handleView = (survey: SurveySummaryDto): void => {
    setSelectedSurvey(survey);
    setShowViewDialog(true);
  };

  if (isLoading) return <CircularProgress />;
  if (isError) return <Alert severity="error">Failed to load surveys</Alert>;

  if (showBuilder) {
    return (
      <SurveyBuilderDialog
        key={selectedSurvey?.id || "new"}
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
          className="gradient-text"
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
          <CardContent className="empty-state">
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
        <Grid container spacing={{ xs: 2, sm: 3 }} className="survey-grid">
          {surveys?.map((survey) => (
            <Grid item xs={12} sm={6} md={6} lg={4} key={survey.id}>
              <Card className="survey-item-card">
                <CardContent className="survey-item-content">
                  <Typography
                    variant="h6"
                    gutterBottom
                    noWrap
                    className="survey-item-title"
                  >
                    {survey.title}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    variant="body2"
                    gutterBottom
                    className="survey-item-description"
                  >
                    ID: {survey.id.slice(0, 8)}...
                  </Typography>
                  <Chip
                    label="Active"
                    color="success"
                    size="small"
                    className="survey-item-stats"
                  />
                </CardContent>
                <Divider />
                <Box className="survey-item-actions">
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit(survey)}
                    title="Edit Survey"
                    size="small"
                    className="action-button-small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    color="info"
                    title="View Survey"
                    onClick={() => handleView(survey)}
                    size="small"
                    className="action-button-small"
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(survey)}
                    title="Delete Survey"
                    size="small"
                    className="action-button-small"
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
