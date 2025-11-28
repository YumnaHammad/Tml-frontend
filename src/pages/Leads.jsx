import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  MessageCircle,
  Phone,
  Calendar,
  User,
  ArrowLeft,
  Send,
  Paperclip,
  MoreVertical,
  CheckCircle,
  Clock,
  Loader,
  Trash2,
  Archive,
  Volume2,
  VolumeX,
  X,
  List,
  Grid3X3,
  RefreshCw,
  Printer,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import axios from "axios";
import ExportButton from "../components/ExportButton";
import { exportToExcel } from "../utils/exportUtils";

const Leads = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // 'grid' or 'list'
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all"); // 'all', 'day', 'week', 'month', 'year', 'custom'
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setRefreshing(true);
      // Fetch all conversations without limit
      const response = await axios.get(
        "/api/conversations?limit=1000"
      );
      const allConversations = response.data.data?.conversations || response.data.data || [];
      console.log("Total conversations fetched:", allConversations.length);
      setConversations(allConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(
        "/api/conversations-stats"
      );
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (phoneNumber, page = 1) => {
    if (!phoneNumber) return;

    try {
      const response = await axios.get(
        `/api/conversations/${phoneNumber}/messages?page=${page}&limit=50`
      );
      setMessages(response.data.data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConversations(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Auto-refresh conversations
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchConversations();
      fetchStats();

      if (selectedConversation) {
        fetchMessages(selectedConversation.phoneNumber);
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter conversations based on search, filter, and date/time
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.phoneNumber.includes(searchTerm) ||
      conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && conv.unreadCount > 0) ||
      (filter === "active" && conv.isActive);

    // Date/Time filtering
    let matchesDate = true;
    if (timeFilter !== "all" && conv.lastMessageTimestamp) {
      const messageDate = new Date(conv.lastMessageTimestamp);
      const now = new Date();
      let startDate, endDate;

      switch (timeFilter) {
        case "day":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate.setHours(23, 59, 59, 999);
          break;
        case "week":
          const dayOfWeek = now.getDay();
          const diff = now.getDate() - dayOfWeek;
          startDate = new Date(now.setDate(diff));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), 11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "custom":
          if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999);
          } else {
            matchesDate = true; // If dates not set, show all
            break;
          }
          break;
        default:
          matchesDate = true;
      }

      if (timeFilter !== "all" && timeFilter !== "custom") {
        matchesDate = messageDate >= startDate && messageDate <= endDate;
      } else if (timeFilter === "custom" && customStartDate && customEndDate) {
        matchesDate = messageDate >= startDate && messageDate <= endDate;
      }
    }

    return matchesSearch && matchesFilter && matchesDate;
  });

  // Debug: Log filtered conversations count
  useEffect(() => {
    if (conversations.length > 0) {
      console.log("Total conversations:", conversations.length);
      console.log("Filtered conversations:", filteredConversations.length);
      console.log("Filter:", filter, "TimeFilter:", timeFilter, "Search:", searchTerm);
    }
  }, [conversations.length, filteredConversations.length, filter, timeFilter, searchTerm]);

  // Handle export to Excel
  const handleExportConversations = async (format = "excel") => {
    try {
      // Prepare data for export
      const exportData = filteredConversations.map((conv, index) => ({
        "S.No": index + 1,
        "Phone Number": conv.phoneNumber,
        "Last Activity": conv.lastMessageTimestamp
          ? new Date(conv.lastMessageTimestamp).toLocaleString()
          : "N/A",
        "Total Messages": conv.messageCount || 0,
        "Incoming": conv.incomingCount || 0,
        "Outgoing": conv.outgoingCount || 0,
        "Status": conv.isActive ? "Active" : "Inactive",
        "Unread Count": conv.unreadCount || 0,
      }));

      const result = await exportToExcel(
        exportData,
        `whatsapp-conversations-${timeFilter === "all" ? "all" : timeFilter}`,
        "WhatsApp Conversations"
      );

      // Return result to ExportButton - it will handle showing success/error messages
      // Make sure to return success: true to prevent error message
      if (result && result.success) {
        return { success: true };
      } else {
        return { success: false, error: result?.error || "Export failed" };
      }
    } catch (error) {
      console.error("Export error:", error);
      return { success: false, error: error?.message || "Failed to export conversations" };
    }
  };

  // Select conversation and open modal
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setIsModalOpen(true);
    await fetchMessages(conversation.phoneNumber);

    // Mark as read
    if (conversation.unreadCount > 0) {
      try {
        await axios.post(
          `/api/conversations/${conversation.phoneNumber}/read`
        );
        // Update local state
        setConversations((prev) =>
          prev.map((conv) =>
            conv.phoneNumber === conversation.phoneNumber
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConversation(null);
    setMessages([]);
  };

  // Format timestamp - FIXED VERSION
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      return new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) return "Today";
      if (days === 1) return "Yesterday";
      if (days < 7) return `${days} days ago`;
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Get message status icon
  const getStatusIcon = (message) => {
    if (message.direction !== "outgoing") return null;

    switch (message.status) {
      case "sent":
        return <CheckCircle className="w-3 h-3" />;
      case "delivered":
        return (
          <div className="flex">
            <CheckCircle className="w-3 h-3" />
            <CheckCircle className="w-3 h-3 -ml-1" />
          </div>
        );
      case "read":
        return (
          <div className="flex text-blue-300">
            <CheckCircle className="w-3 h-3" />
            <CheckCircle className="w-3 h-3 -ml-1" />
          </div>
        );
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  WhatsApp Conversations
                </h1>
                <p className="text-gray-600 text-sm">
                  {filteredConversations.length} {filteredConversations.length === conversations.length ? 'conversations' : `of ${conversations.length} conversations`} •{" "}
                  {filteredConversations.reduce((total, conv) => total + (conv.messageCount || 0), 0)} {filteredConversations.length === conversations.length ? 'messages' : `of ${stats.totalMessages || 0} messages`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="List View"
                >
                  <List className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline text-sm font-medium">
                    List
                  </span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline text-sm font-medium">
                    Grid
                  </span>
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchConversations}
                disabled={refreshing}
                className="flex items-center px-3 py-1.5 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap disabled:opacity-50"
                title="Refresh conversations"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Export Button */}
              <ExportButton
                data={filteredConversations}
                filename="whatsapp-conversations"
                title="WhatsApp Conversations"
                exportFunction={handleExportConversations}
                variant="default"
                buttonText="Export"
              />

              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-colors ${
                  autoRefresh
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
                title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
              >
                {autoRefresh ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>

              {/* Stats badge */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-blue-700 font-medium">
                    {filteredConversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)} unread
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-green-600 font-medium">
                    {filteredConversations.filter(c => c.isActive).length} active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter Section */}
        <div className="mb-6">
          <div className="card p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search conversations by phone number or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                {[
                  { key: "all", label: "All", count: conversations.length },
                  {
                    key: "unread",
                    label: "Unread",
                    count: conversations.filter((c) => c.unreadCount > 0)
                      .length,
                  },
                  {
                    key: "active",
                    label: "Active",
                    count: conversations.filter((c) => c.isActive).length,
                  },
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === key
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>
            </div>

            {/* Date/Time Filter Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t border-gray-200 mt-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">
                  Filter by Date/Time:
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={timeFilter}
                  onChange={(e) => {
                    setTimeFilter(e.target.value);
                    if (e.target.value !== "custom") {
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }
                  }}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="day">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>

                {/* Custom Date Range */}
                {timeFilter === "custom" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 whitespace-nowrap">From:</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 whitespace-nowrap">To:</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conversations - Grid or List View */}
        {viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredConversations.map((conversation, index) => (
                <motion.div
                  key={conversation.phoneNumber}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelectConversation(conversation)}
                  className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <User className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">
                          {conversation.phoneNumber}
                        </h3>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {conversation.lastMessage || "No messages yet"}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              conversation.lastMessageType === "text"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {conversation.lastMessageType || "text"}
                          </span>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              conversation.isActive
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          />
                        </div>

                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(conversation.lastMessageTimestamp)}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          <span className="font-medium text-gray-700">
                            {conversation.messageCount || 0}
                          </span>{" "}
                          messages
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="font-medium text-green-600">
                            {conversation.incomingCount || 0}
                          </span>{" "}
                          in
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="font-medium text-blue-600">
                            {conversation.outgoingCount || 0}
                          </span>{" "}
                          out
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* List/Table View */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      S.No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Messages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredConversations.map((conversation, index) => (
                      <motion.tr
                        key={conversation.phoneNumber}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <td className="px-2 py-4 whitespace-nowrap text-center w-10">
                          <div className="text-sm font-medium text-gray-900">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 flex items-center">
                                {conversation.phoneNumber}
                                {conversation.unreadCount > 0 && (
                                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {conversation.lastMessage || "No messages yet"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              conversation.lastMessageType === "text"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {conversation.lastMessageType || "text"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>
                              <span className="font-medium">
                                {conversation.messageCount || 0}
                              </span>{" "}
                              total
                            </div>
                            <div className="text-xs text-gray-500">
                              <span className="text-green-600">
                                {conversation.incomingCount || 0}
                              </span>{" "}
                              in •{" "}
                              <span className="text-blue-600">
                                {conversation.outgoingCount || 0}
                              </span>{" "}
                              out
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`w-2 h-2 rounded-full mr-2 ${
                                conversation.isActive
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            />
                            <span className="text-sm text-gray-900">
                              {conversation.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(conversation.lastMessageTimestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectConversation(conversation);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                          >
                            View
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredConversations.length === 0 && (
          <div className="card p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No conversations found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "No conversations match your search criteria. Try adjusting your search terms."
                : "No conversations available. WhatsApp messages will appear here once received."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {isModalOpen && selectedConversation && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            >
              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col"
              >
                {/* Chat Header */}
                <div className="border-b border-gray-200 bg-white p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900 text-lg">
                          {selectedConversation.phoneNumber}
                        </h2>
                        <p className="text-sm text-gray-600 flex items-center">
                          <span
                            className={`w-2 h-2 rounded-full mr-2 ${
                              selectedConversation.isActive
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          />
                          {selectedConversation.isActive
                            ? "Active now"
                            : "Offline"}
                          <span className="mx-2">•</span>
                          {selectedConversation.messageCount || 0} messages
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Phone className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={handleCloseModal}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  <div className="space-y-4 max-w-4xl mx-auto">
                    <AnimatePresence>
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.messageId || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${
                            message.direction === "outgoing"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                              message.direction === "outgoing"
                                ? "bg-blue-600 text-white rounded-br-none shadow-md"
                                : "bg-white border border-gray-200 rounded-bl-none shadow-sm"
                            }`}
                          >
                            {/* Message Content */}
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content ||
                                message.caption ||
                                `[${
                                  message.messageType?.toUpperCase() ||
                                  "UNKNOWN"
                                } MESSAGE]`}
                            </p>

                            {/* Message Meta */}
                            <div
                              className={`flex items-center justify-between mt-2 text-xs ${
                                message.direction === "outgoing"
                                  ? "text-blue-100"
                                  : "text-gray-500"
                              }`}
                            >
                              <span>{formatTime(message.timestamp)}</span>
                              <div className="flex items-center space-x-1 ml-2">
                                {getStatusIcon(message)}
                              </div>
                            </div>

                            {/* Media Indicator */}
                            {message.hasMedia && (
                              <div className="mt-2 flex items-center space-x-1 text-xs opacity-75">
                                <Paperclip className="w-3 h-3" />
                                <span>
                                  {message.attachments?.[0]?.fileName ||
                                    `${message.messageType} file`}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {messages.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No messages in this conversation yet</p>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* View Only Notice */}
                <div className="border-t border-gray-200 bg-blue-50 p-4">
                  <div className="text-center">
                    <p className="text-sm text-blue-700">
                      💬 View-only mode - Messages are sent through the main
                      WhatsApp interface
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Leads;
