import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PhoneCall,
  Search,
  Filter,
  RefreshCw,
  Eye,
  XCircle,
  MessageCircle,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  List,
  Grid3X3,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import CenteredLoader from "../components/CenteredLoader";

const OldCRM = () => {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [meta, setMeta] = useState({
    mine_count: 0,
    assigned_count: 0,
    unassigned_count: 0,
    all_count: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, open, resolved, pending
  const [assigneeFilter, setAssigneeFilter] = useState("all"); // all, mine, assigned, unassigned
  const [viewMode, setViewMode] = useState("table"); // table or grid
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch conversations from Chatwoot API via backend proxy
  const fetchConversations = async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      const params = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (assigneeFilter !== "all") {
        params.assignee_type = assigneeFilter;
      }

      const response = await api.get("/chatwoot/conversations", { params });

      console.log("Chatwoot API Response:", response.data);

      if (response.data && response.data.success) {
        // Backend wraps Chatwoot response in { success: true, data: chatwootResponse }
        // Chatwoot response structure: { data: { meta: {...}, payload: [...] } }
        const chatwootResponse = response.data.data;
        
        if (chatwootResponse && chatwootResponse.data) {
          // Standard Chatwoot structure
          const conversationsData = chatwootResponse.data.payload || [];
          const metaData = chatwootResponse.data.meta || {};

          setConversations(conversationsData);
          setMeta(metaData);
        } else if (chatwootResponse && chatwootResponse.payload) {
          // Fallback: direct payload structure
          const conversationsData = chatwootResponse.payload || [];
          const metaData = chatwootResponse.meta || {};
          setConversations(conversationsData);
          setMeta(metaData);
        } else {
          console.warn("Unexpected response structure:", chatwootResponse);
          setConversations([]);
          setMeta({
            mine_count: 0,
            assigned_count: 0,
            unassigned_count: 0,
            all_count: 0,
          });
          toast.error("Unexpected response format from Chatwoot");
        }
      } else {
        setConversations([]);
        setMeta({
          mine_count: 0,
          assigned_count: 0,
          unassigned_count: 0,
          all_count: 0,
        });
        toast.error(response.data?.error || "No conversations found");
      }
    } catch (error) {
      console.error("Error fetching Chatwoot conversations:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to load conversations from Chatwoot";
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      toast.error(errorMessage);
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const customerName =
        conv.meta?.sender?.name?.toLowerCase() || "";
      const phoneNumber =
        conv.meta?.sender?.phone_number?.toLowerCase() || "";
      const assigneeName =
        conv.meta?.assignee?.name?.toLowerCase() || "";

      if (
        !customerName.includes(searchLower) &&
        !phoneNumber.includes(searchLower) &&
        !assigneeName.includes(searchLower)
      ) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "open" && conv.status !== "open") return false;
      if (statusFilter === "resolved" && conv.status !== "resolved")
        return false;
      if (statusFilter === "pending" && conv.status !== "pending")
        return false;
    }

    // Assignee filter
    if (assigneeFilter !== "all") {
      if (assigneeFilter === "unassigned" && conv.meta?.assignee)
        return false;
      if (assigneeFilter === "assigned" && !conv.meta?.assignee)
        return false;
    }

    return true;
  });

  const handleViewConversation = (conversation) => {
    setSelectedConversation(conversation);
    setShowModal(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const getStatusColor = (status) => {
    const colors = {
      open: "bg-green-100 text-green-800",
      resolved: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      closed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getChannelIcon = (channel) => {
    if (channel?.includes("Whatsapp")) return Phone;
    if (channel?.includes("Email")) return Mail;
    return MessageCircle;
  };

  if (loading && conversations.length === 0) {
    return <CenteredLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Old CRM - Chatwoot Conversations
          </h1>
          <p className="text-gray-600">
            Manage customer conversations from Chatwoot
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">All Conversations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {meta.all_count || 0}
                </p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-green-600">
                  {meta.assigned_count || 0}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {meta.unassigned_count || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mine</p>
                <p className="text-2xl font-bold text-purple-600">
                  {meta.mine_count || 0}
                </p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by customer name, phone, or assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Conversations</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <List className="h-5 w-5" />
                Table
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Grid3X3 className="h-5 w-5" />
                Grid
              </button>
              <button
                onClick={fetchConversations}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Conversations Display */}
        {filteredConversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No conversations found</p>
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Messages
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredConversations.map((conversation) => {
                    const ChannelIcon = getChannelIcon(
                      conversation.meta?.channel
                    );
                    const lastMessage =
                      conversation.last_non_activity_message ||
                      conversation.messages?.[0];
                    return (
                      <tr
                        key={conversation.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewConversation(conversation)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {conversation.meta?.sender?.name || "Unknown"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {conversation.meta?.sender?.phone_number ||
                                conversation.meta?.sender?.email ||
                                "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <ChannelIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {conversation.meta?.channel?.replace(
                                "Channel::",
                                ""
                              ) || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {conversation.meta?.assignee?.name || (
                              <span className="text-gray-400">Unassigned</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              conversation.status
                            )}`}
                          >
                            {conversation.status || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(conversation.last_activity_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {conversation.messages?.length || 0} message
                          {conversation.messages?.length !== 1 ? "s" : ""}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewConversation(conversation);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConversations.map((conversation) => {
              const ChannelIcon = getChannelIcon(conversation.meta?.channel);
              const lastMessage =
                conversation.last_non_activity_message ||
                conversation.messages?.[0];
              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewConversation(conversation)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {conversation.meta?.sender?.name || "Unknown"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {conversation.meta?.sender?.phone_number ||
                          conversation.meta?.sender?.email ||
                          "N/A"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        conversation.status
                      )}`}
                    >
                      {conversation.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ChannelIcon className="h-4 w-4" />
                      <span>
                        {conversation.meta?.channel?.replace("Channel::", "") ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>
                        {conversation.meta?.assignee?.name || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(conversation.last_activity_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MessageCircle className="h-4 w-4" />
                      <span>
                        {conversation.messages?.length || 0} message
                        {conversation.messages?.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {lastMessage && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Last Message:</p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {lastMessage.content ||
                          lastMessage.processed_message_content ||
                          "No content"}
                      </p>
                      {lastMessage.attachments?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {lastMessage.attachments.length} attachment
                          {lastMessage.attachments.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Conversation Detail Modal */}
        {showModal && selectedConversation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Conversation Details
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedConversation(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-base font-medium text-gray-900">
                        {selectedConversation.meta?.sender?.name || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-base font-medium text-gray-900">
                        {selectedConversation.meta?.sender?.phone_number ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-base font-medium text-gray-900">
                        {selectedConversation.meta?.sender?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          selectedConversation.status
                        )}`}
                      >
                        {selectedConversation.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assignee Info */}
                {selectedConversation.meta?.assignee && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Assigned To
                    </h3>
                    <p className="text-base text-gray-900">
                      {selectedConversation.meta.assignee.name} (
                      {selectedConversation.meta.assignee.email})
                    </p>
                  </div>
                )}

                {/* Messages */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Messages ({selectedConversation.messages?.length || 0})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedConversation.messages?.map((message) => (
                      <div
                        key={message.id}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {message.sender?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(
                                message.created_at
                              ).toLocaleString()}
                            </p>
                          </div>
                          {message.status && (
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                message.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {message.status}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {message.content ||
                            message.processed_message_content ||
                            "No content"}
                        </p>
                        {message.attachments?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">
                              Attachments:
                            </p>
                            {message.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.data_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline mr-2"
                              >
                                {att.file_type} ({att.file_size} bytes)
                              </a>
                            ))}
                          </div>
                        )}
                        {message.content_attributes?.external_error && (
                          <p className="text-xs text-red-600 mt-1">
                            Error: {message.content_attributes.external_error}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Channel</p>
                    <p className="text-gray-900">
                      {selectedConversation.meta?.channel?.replace(
                        "Channel::",
                        ""
                      ) || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created At</p>
                    <p className="text-gray-900">
                      {formatDate(selectedConversation.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Activity</p>
                    <p className="text-gray-900">
                      {formatDate(selectedConversation.last_activity_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Unread Count</p>
                    <p className="text-gray-900">
                      {selectedConversation.unread_count || 0}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OldCRM;
