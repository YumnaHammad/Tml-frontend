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
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import axios from "axios";

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
  const messagesEndRef = useRef(null);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await axios.get(
        "/api/conversations"
      );
      setConversations(response.data.data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
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

  // Filter conversations based on search and filter
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.phoneNumber.includes(searchTerm) ||
      conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && conv.unreadCount > 0) ||
      (filter === "active" && conv.isActive);

    return matchesSearch && matchesFilter;
  });

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
                  {stats.totalConversations || 0} conversations •{" "}
                  {stats.totalMessages || 0} messages
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-colors ${
                  autoRefresh
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
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
                    {stats.totalUnread || 0} unread
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-green-600 font-medium">
                    {stats.activeConversations || 0} active
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
          </div>
        </div>

        {/* Conversation Cards Grid */}
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
