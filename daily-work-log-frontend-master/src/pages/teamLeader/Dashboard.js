import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaEye, FaTrash } from 'react-icons/fa';
import { logService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import moment from 'moment';

const TeamLeaderDashboard = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await logService.getTeamLeaderLogs();
      setLogs(response.data);
      setError('');
    } catch (err) {
      console.error('שגיאה בטעינת הדו"חות:', err);
      setError('נכשל בטעינת הדו"חות היומיים שלך. אנא נסה שוב.');
      toast.error('נכשל בטעינת הדו"חות היומיים שלך');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (id) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את הדו"ח?')) {
      try {
        await logService.deleteLog(id);
        toast.success('הדו"ח נמחק בהצלחה');
        fetchLogs();
      } catch (err) {
        console.error('שגיאה במחיקת דו"ח:', err);
        toast.error('נכשל במחיקת הדו"ח');
      }
    }
  };

  const handleSubmitLog = async (id) => {
    try {
      await logService.submitLog(id);
      toast.success('הדו"ח נשלח בהצלחה');
      fetchLogs();
    } catch (err) {
      console.error('שגיאה בשליחת דו"ח:', err);
      toast.error('נכשל בשליחת הדו"ח');
    }
  };

  return (
    <Container dir="rtl">
      <Row className="mb-4">
        <Col>
          <h2>לוח מחוונים - ראש צוות</h2>
          <p className="text-muted">ברוך שובך, {user?.fullName}</p>
        </Col>
        <Col xs="auto">
          <Button as={Link} to="/create-log" variant="primary">
            <FaPlus className="me-1" /> יצירת דו"ח חדש
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Header>
          <h5 className="mb-0">הדו"חות היומיים האחרונים שלך</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <p className="text-center">טוען את הדו"חות שלך...</p>
          ) : logs.length === 0 ? (
            <p className="text-center">לא נמצאו דו"חות. צור את הדו"ח היומי הראשון שלך!</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>פרויקט</th>
                  <th>שעות עבודה</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 5).map((log) => (
                  <tr key={log._id}>
                    <td>{moment(log.date).format('DD/MM/YYYY')}</td>
                    <td>{log.project?.name || log.project}</td>
                    <td>
                      {moment(log.startTime).format('HH:mm')} - {moment(log.endTime).format('HH:mm')}
                    </td>
                    <td>
                      <Button
                        as={Link}
                        to={`/view-log/${log._id}`}
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                      >
                        <FaEye />
                      </Button>

                      {log.status === 'draft' && (
                        <>
                          {/* <Button
                            as={Link}
                            to={`/edit-log/${log._id}`}
                            variant="outline-secondary"
                            size="sm"
                            className="me-1"
                          >
                            <FaEdit />
                          </Button> */}

                          {/* <Button
                            variant="outline-success"
                            size="sm"
                            className="me-1"
                            onClick={() => handleSubmitLog(log._id)}
                          >
                            שלח
                          </Button> */}

                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteLog(log._id)}
                          >
                            <FaTrash />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TeamLeaderDashboard;
