import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useData } from '../context/DataContext';

const ISSUE_TYPES = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'structural', label: 'Structural' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' }
];

const STATUS_COLORS = {
  'New': 'error',
  'Assigned': 'warning',
  'In Progress': 'info',
  'Paused': 'default',
  'Completed': 'success',
  'Verified': 'secondary',
  'Rejected': 'error',
  'More Info Needed': 'info'
};

const TICKET_WORKFLOW = [
  { key: 'created', label: 'Ticket Placed', description: 'Maintenance request submitted', status: 'New' },
  { key: 'pending_approval', label: 'Pending Approval', description: 'Waiting for approval from admin', status: 'New' },
  { key: 'assigned', label: 'Vendor Assigned', description: 'Ticket assigned to vendor', status: 'Assigned' },
  { key: 'waiting_vendor_response', label: 'Awaiting Vendor Response', description: 'Waiting for vendor to accept, reject, or request more info', status: 'Assigned' },
  { key: 'vendor_accepted', label: 'Vendor Accepted', description: 'Vendor accepted the ticket', status: 'Assigned' },
  { key: 'vendor_rejected', label: 'Vendor Rejected', description: 'Vendor rejected the ticket', status: 'Rejected' },
  { key: 'more_info_requested', label: 'More Info Requested', description: 'Vendor requested more information', status: 'More Info Needed' },
  { key: 'work_order', label: 'Work Order Created', description: 'Vendor created work order', status: 'Assigned' },
  { key: 'in_progress', label: 'Work In Progress', description: 'Vendor is working on the issue', status: 'In Progress' },
  { key: 'invoice_uploaded', label: 'Invoice Uploaded', description: 'Work completed and invoice uploaded', status: 'Completed' },
  { key: 'awaiting_approval', label: 'Awaiting Approval', description: 'Waiting for final approval', status: 'Completed' },
  { key: 'completed', label: 'Order Complete', description: 'All work verified and completed', status: 'Verified' }
];

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTicket, getLocation, getVendor } = useData();

  const ticket = getTicket(id);

  if (!ticket) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Ticket not found</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Back
        </Button>
      </Box>
    );
  }

  const location = getLocation(ticket.locationId);
  const vendor = getVendor(ticket.vendorId || ticket.assignedVendorId);

  const currentStep = TICKET_WORKFLOW.findIndex(
    step =>
      step.key === (ticket.status || '').toLowerCase() ||
      step.status.toLowerCase() === (ticket.status || '').toLowerCase()
  );

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back
      </Button>

      <Typography variant="h5" gutterBottom>
        Ticket {ticket.ticketNo}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Status</Typography>
          <Chip label={ticket.status} color={STATUS_COLORS[ticket.status]} size="small" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Date/Time</Typography>
          <Typography variant="body2">
            {ticket.dateTime ? new Date(ticket.dateTime).toLocaleString() : ''}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2">Location</Typography>
          <Typography variant="body2">{location ? location.name : 'Unknown'}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2">Issue Type</Typography>
          <Typography variant="body2">
            {ISSUE_TYPES.find(t => t.value === ticket.issueType)?.label || ticket.issueType}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2">Description</Typography>
          <Typography variant="body2">{ticket.description || 'No description'}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2">Assigned Vendor</Typography>
          <Typography variant="body2">{vendor ? vendor.name : 'Unassigned'}</Typography>
        </Grid>
      </Grid>

      <Typography variant="subtitle2" gutterBottom>
        Workflow Progress
      </Typography>
      <Stepper activeStep={currentStep} alternativeLabel sx={{ mt: 1 }}>
        {TICKET_WORKFLOW.map(step => (
          <Step key={step.key}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default TicketDetail;
