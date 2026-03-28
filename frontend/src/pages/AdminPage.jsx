import { useState, useRef } from "react";
import AdminDashboard from "./AdminDashboard";
import CreateQueue from "./CreateQueue";
import QueueControl from "./QueueControl";
import Layout from "../components/Layout";

function AdminPage({ adminId }) {
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [showCreateQueue, setShowCreateQueue] = useState(false);
  const dashboardRef = useRef();

  const handleOpenQueue = (queue) => {
    setSelectedQueue(queue);
  };

  const handleCreateQueue = () => {
    setShowCreateQueue(true);
  };

  const handleQueueCreated = () => {
    setShowCreateQueue(false);
    // Refresh the dashboard after creating a queue
    if (dashboardRef.current) {
      dashboardRef.current.refreshQueues();
    }
  };

  const goBack = () => {
    setSelectedQueue(null);
    setShowCreateQueue(false);
  };

  if (showCreateQueue) {
    return (
      <Layout role="admin">
        <CreateQueue
          onQueueCreated={handleQueueCreated}
          onBack={goBack}
        />
      </Layout>
    );
  }

  if (selectedQueue) {
    return (
      <Layout role="admin">
        <QueueControl
          queue={selectedQueue}
          goBack={goBack}
        />
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <AdminDashboard
        ref={dashboardRef}
        adminId={adminId}
        onOpenQueue={handleOpenQueue}
        onCreateQueue={handleCreateQueue}
      />
    </Layout>
  );
}

export default AdminPage;
