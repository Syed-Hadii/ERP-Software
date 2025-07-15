import axios from "axios";
import { RotatingLines } from "react-loader-spinner";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { NavLink, useNavigate, Link as RouterLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Fragment, useCallback } from "react";
import { BASE_URL } from "../config/config";
import AuthService from './auth';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';

import { Check as CheckIcon } from '@mui/icons-material';

const axiosInstance = axios.create({
  baseURL: BASE_URL || "http://localhost:3002",
});
// ✅ Automatically attach token to every request
axiosInstance.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (refreshToken) {
    config.headers['x-refresh-token'] = refreshToken;
  }

  return config;
});

const RETRY_DELAY = 5000; // 5 seconds
const TOKEN_REFRESH_BUFFER = 60000; // 1 minute buffer before expiry
const MAX_RETRY_ATTEMPTS = 3;

let isRefreshing = false;
let failedQueue = [];
let retryCount = 0;

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshTokenWithRetry = async (retryAttempt = 0) => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await axios.post(`${BASE_URL}/user/refresh-token`, { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;

    AuthService.setTokens(accessToken, newRefreshToken);
    retryCount = 0; // Reset retry count on successful refresh
    return accessToken;
  } catch (error) {
    if (retryAttempt < MAX_RETRY_ATTEMPTS && navigator.onLine) {
      // Wait and retry if online and under max attempts
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return refreshTokenWithRetry(retryAttempt + 1);
    }
    throw error;
  }
};

// Helper to check if token needs refresh
const shouldRefreshToken = (token) => {
  if (!token) return true;
  try {
    const decoded = AuthService.decodeToken(token);
    const expiryBuffer = new Date(decoded.exp * 1000 - TOKEN_REFRESH_BUFFER);
    return new Date() >= expiryBuffer;
  } catch {
    return true;
  }
};

// Replace your existing axios interceptors with these
axiosInstance.interceptors.request.use(async (config) => {
  const accessToken = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');

  // Add refresh token to headers
  if (refreshToken) {
    config.headers['x-refresh-token'] = refreshToken;
  }

  // Check if token needs refresh before request
  if (accessToken && shouldRefreshToken(accessToken)) {
    try {
      const newToken = await refreshTokenWithRetry();
      config.headers.Authorization = `Bearer ${newToken}`;
    } catch (error) {
      // Continue with old token if refresh fails
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
  } else if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Handle offline scenario
    if (!navigator.onLine) {
      // Store failed request to retry when back online
      window.addEventListener('online', async () => {
        try {
          const newToken = await refreshTokenWithRetry();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Handle refresh failure when back online
          if (refreshError.response?.status === 401) {
            AuthService.clearAuth();
            window.location.href = '/login';
          }
        }
      }, { once: true });

      return new Promise((resolve) => {
        // Keep request pending until back online
        window.addEventListener('online', () => {
          resolve(axiosInstance(originalRequest));
        }, { once: true });
      });
    }

    if (!isRefreshing) {
      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const newToken = await refreshTokenWithRetry();
        isRefreshing = false;

        // Process queued requests
        processQueue(null, newToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);

        // Only logout if refresh token is invalid
        if (refreshError.response?.status === 401) {
          AuthService.clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Queue failed requests
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }
);


// Import Timeline components from MUI Lab
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  TabList,
  TabPanel,
} from "@mui/lab";

import {
  Edit as EditIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Calculate as CalculateIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  Remove as RemoveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DeleteForever as DeleteForeverIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Print as PrintIcon,
  ShoppingCart as ShoppingCartIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitToAppIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Map as MapIcon,
  Person as PersonIcon,
  LocalShipping as LocalShippingIcon,
  AccountBalance as AccountBalanceIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Warehouse as WarehouseIcon,
  Receipt as ReceiptIcon,
  BarChart as BarChartIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  NavigateNext as NavigateNextIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Description as DescriptionIcon,
  CallMade as CallMadeIcon,
  CallReceived as CallReceivedIcon,
  Assessment as AssessmentIcon,
  Category as CategoryIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Clear as ClearIcon,
  FileDownload as FileDownloadIcon,
  ArrowForward as ArrowForwardIcon,
  MoreVert as MoreVertIcon,
  Agriculture as AgricultureIcon,
  Landscape as LandscapeIcon,
  Grass as GrassIcon,
  Egg as EggIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Event as EventIcon,
  Build as BuildIcon,
  RequestQuote as RequestQuoteIcon,
  PointOfSale as PointOfSaleIcon,
  Analytics as AnalyticsIcon,
  Money as LoanIcon,
  PieChart as PieChartIcon,
  DoNotDisturb as DoNotDisturbAltIcon,
  CalendarMonth as CalendarMonthIcon,
  EventBusy as EventBusyIcon,
  ShowChart as ShowChartIcon,
  AttachMoney as AttachMoneyIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  PersonOutline as PersonOutlineIcon,
  Spa as SpaIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  Terrain as TerrainIcon,
  Note as NoteIcon,
  Info as InfoIcon,
  BugReport as BugReportIcon,
  EmojiNature as EcoIcon,
  Opacity as OpacityIcon,
  EventNote as EventNoteIcon,
  Water as WaterIcon,
  Science as ScienceIcon,
  LocationOn as LocationOnIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  StickyNote2 as StickyNote2Icon,
  LocalOffer as LocalOfferIcon,
  LocalDrink as LocalDrinkIcon,
  Scale as ScaleIcon,
  DeleteOutline as DeleteOutlineIcon,
  Send as SendIcon,
  WarningOutlined as WarningOutlinedIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  ViewList as ViewListIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Pets as PetsIcon,
  Wc as WcIcon,
  Cake as CakeIcon,
  Source as SourceIcon,
  Paid as PaidIcon,
  Circle as CircleIcon,
  LocalHospital as LocalHospitalIcon,
  DateRange as DateRangeIcon,
  FitnessCenter as FitnessCenterIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  ToggleOn as ToggleOnIcon,
  Place as PlaceIcon,
  MedicalServices as MedicalServicesIcon,
  Medication as MedicationIcon,
  Schedule as ScheduleIcon,
  Notes as NotesIcon,
  Pending as PendingIcon,
  Book as BookIcon,
  Feed as FeedIcon,
  MonitorHeart as HeartPulseIcon,
  ArrowRight as ArrowRightIcon,
  Assignment as ClipboardIcon,
  LocalDrink as MilkIcon,
  Work as WorkIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  FormatListNumbered as FormatListNumberedIcon,
  Payment as PaymentIcon,
  Star as StarIcon,
  Payments as PaymentsIcon,
  MoneyOff as MoneyOffIcon,
  EventBusy as LeaveIcon,
  Numbers as NumbersIcon,
  Group as GroupIcon, // Added missing Group icon
  Inventory2 as Inventory2Icon, // Added missing Inventory2 icon
} from "@mui/icons-material"

import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaEye,
  FaSearch,
  FaDesktop,
  FaUser,
  FaBox,
  FaWarehouse,
  FaChartLine,
  FaReceipt,
  FaStore,
  FaPeopleCarry,
  FaMapMarkedAlt,
  FaUserShield,
  FaUserCircle,
  FaAngleLeft,
  FaAngleRight,
  FaShoppingCart,
  FaBell,
  FaCog,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFilter,
  FaEyeSlash,
  FaTrashAlt
} from "react-icons/fa";
import {
  Container,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Tab,
  Typography,
  Table,

  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Modal,
  TextField,
  Grid,
  FormControl,
  useTheme,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  TableSortLabel,
  Icon,
  Divider,
  CircularProgress,
  Menu,
  Stack,
  Slide,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Dialog,
  Badge,
  Tooltip,
  Stepper,
  StepLabel,
  AppBar,
  Toolbar,
  Avatar,
  styled,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Breadcrumbs,
  InputAdornment,
  CssBaseline,
  ThemeProvider,
  Alert,
  Link,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  OutlinedInput,
  TablePagination,
  Step,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Checkbox,
  ButtonGroup,
  Snackbar,
  alpha,
  CardHeader,
  CardActionArea,
  CardMedia,
  LinearProgress,
  Radio,
  RadioGroup,
  FormLabel,
  Drawer,
  useMediaQuery,
  Popover,
} from "@mui/material";

import {
  AccountTree as AccountTreeIcon,
  TableRows as TableRowsIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';


const Wrapper = {
  // React Router
  NavLink,
  useNavigate,
  RouterLink,
  useLocation,

  // React Components
  Fragment,
  useCallback,
  // Animation Libraries
  motion,
  AnimatePresence,
  RotatingLines,

  // Utility Libraries
  axios: axiosInstance,
  toast,

  // React Icons
  AiOutlineArrowLeft,

  // Timeline Components
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,

  // Material UI Components
  Container,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Table,
  TabList,
  TabPanel,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Modal,
  Tabs,
  Tab,
  TextField,
  Grid,
  FormControl,
  useTheme,
  InputLabel,
  Select,
  Snackbar,
  alpha,
  MenuItem,
  Pagination,
  IconButton,
  TableSortLabel,
  Icon,
  Divider,
  CircularProgress,
  Menu,
  Stack,
  Slide,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Dialog,
  Badge,
  Tooltip,
  Stepper,
  StepLabel,
  AppBar,
  Toolbar,
  Avatar,
  styled,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Breadcrumbs,
  InputAdornment,
  CssBaseline,
  ThemeProvider,
  Alert,
  Link,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  OutlinedInput,
  TablePagination,
  Step,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Checkbox,
  ButtonGroup,
  Radio,
  RadioGroup,
  FormLabel,

  // Font Awesome Icons
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaEye,
  FaSearch,
  FaDesktop,
  FaUser,
  FaBox,
  FaWarehouse,
  FaChartLine,
  FaReceipt,
  FaStore,
  FaPeopleCarry,
  FaMapMarkedAlt,
  FaUserShield,
  FaUserCircle,
  FaAngleLeft,
  FaAngleRight,
  FaShoppingCart,
  FaBell,
  FaCog,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFilter,
  FaEyeSlash,
  FaTrashAlt,

  // Material UI Icons
  EditIcon,
  TerrainIcon,
  CalculateIcon,
  NoteIcon,
  SaveIcon,
  EmailIcon,
  WarningIcon,
  DeleteIcon,
  CancelIcon, 
  RequestQuoteIcon,
  PointOfSaleIcon,
  AnalyticsIcon,
  LoanIcon,
  PieChartIcon,
  DoNotDisturbAltIcon,
  CloseIcon,
  AddIcon,
  NotificationsIcon,
  RemoveIcon,
  VisibilityIcon,
  VisibilityOffIcon,
  DeleteForeverIcon,
  ArrowBackIcon,
  CloudUploadIcon,
  DownloadIcon,
  SearchIcon,
  FilterListIcon,
  PrintIcon,
  ShoppingCartIcon,
  SettingsIcon,
  ExitToAppIcon,
  MenuIcon,
  DashboardIcon,
  PeopleIcon,
  SecurityIcon,
  MapIcon,
  PersonIcon,
  SpaIcon,
  LocalShippingIcon,
  AccountBalanceIcon,
  KeyboardArrowRightIcon,
  StoreIcon,
  InventoryIcon,
  WarehouseIcon,
  ReceiptIcon,
  BarChartIcon,
  KeyboardArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  NavigateNextIcon,
  ExpandMoreIcon,
  ExpandLessIcon,
  DescriptionIcon,
  CallMadeIcon,
  CallReceivedIcon,
  AssessmentIcon,
  CategoryIcon,
  AddCircleOutlineIcon,
  ClearIcon,
  FileDownloadIcon,
  ArrowForwardIcon,
  MoreVertIcon,
  AgricultureIcon,
  LandscapeIcon,
  GrassIcon,
  EggIcon,
  AccountCircleIcon,
  LogoutIcon,
  EventIcon,
  BuildIcon,
  CalendarMonthIcon,
  EventBusyIcon,
  ShowChartIcon,
  AttachMoneyIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
  PersonOutlineIcon,
  InfoIcon,
  BugReportIcon,
  EcoIcon,
  OpacityIcon,
  EventNoteIcon,
  CardHeader,
  CardActionArea,
  CardMedia,
  LinearProgress,
  WaterIcon,
  ScienceIcon,
  LocationOnIcon,
  ChevronLeft: ChevronLeftIcon,
  ChevronRight: ChevronRightIcon,
  Grass: GrassIcon,
  Water: WaterIcon,
  Science: ScienceIcon,
  LocationOn: LocationOnIcon,
  AssignmentTurnedInIcon,
  StickyNote2Icon,
  LocalOfferIcon,
  LocalDrinkIcon,
  ScaleIcon,
  DeleteOutlineIcon,
  SendIcon,
  WarningOutlinedIcon,
  CheckCircleIcon,
  RefreshIcon,
  ViewListIcon,
  CheckCircleOutlineIcon,
  PetsIcon,
  WcIcon,
  CakeIcon,
  SourceIcon,
  PaidIcon,
  CircleIcon,
  LocalHospitalIcon,
  DateRangeIcon,
  FitnessCenterIcon,
  HealthAndSafetyIcon,
  ToggleOnIcon,
  PlaceIcon,
  MedicalServicesIcon,
  MedicationIcon,
  ScheduleIcon,
  NotesIcon,
  PendingIcon,
  BookIcon,
  FeedIcon,
  HeartPulseIcon,
  ArrowRightIcon,
  ClipboardIcon,
  MilkIcon,
  WorkIcon,
  BadgeIcon,
  PhoneIcon,
  FormatListNumberedIcon,
  PaymentIcon,
  StarIcon,
  PaymentsIcon,
  MoneyOffIcon,
  LeaveIcon,
  AccountTreeIcon,
  TableRowsIcon,
  AccountBalanceWalletIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  FolderIcon,
  NumbersIcon,
  LockIcon,
  // Replace MUI DatePicker with react-datepicker
  DatePicker,
  LocalizationProvider,
  AdapterDateFns,

  // New exports
  CheckIcon,
  Drawer,
  useMediaQuery,
  Popover,
  GroupIcon, // Export added Group icon
  Inventory2Icon, // Export added Inventory2 icon
};

export default Wrapper;