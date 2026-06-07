import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Table,
  Form, InputGroup, Alert
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEye, FaSearch, FaCheck, FaFilter, FaEdit } from 'react-icons/fa';
import { logService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import moment from 'moment';

const LOG_FILTERS_STORAGE_KEY = 'manager_all_logs_filters';
const LOG_FILTERS_VISIBLE_KEY = 'manager_all_logs_filters_visible';

const getDefaultFilters = () => ({
  startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
  endDate: moment().format('YYYY-MM-DD'),
  project: '',
  employee: '',
  teamLeader: '',
  searchTerm: ''
});

const getSavedFilters = () => {
  try {
    const savedFilters = localStorage.getItem(LOG_FILTERS_STORAGE_KEY);

    if (!savedFilters) {
      return getDefaultFilters();
    }

    return {
      ...getDefaultFilters(),
      ...JSON.parse(savedFilters)
    };
  } catch (error) {
    console.error('שגיאה בטעינת הסינון השמור:', error);
    return getDefaultFilters();
  }
};

const getSavedFiltersVisibleState = () => {
  try {
    return localStorage.getItem(LOG_FILTERS_VISIBLE_KEY) === 'true';
  } catch (error) {
    console.error('שגיאה בטעינת מצב תיבת הסינון:', error);
    return false;
  }
};

const AllLogs = () => {
  console.log('✅ AllLogs updated version loaded');
  const { user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [showFilters, setShowFilters] = useState(getSavedFiltersVisibleState);
  const [filters, setFilters] = useState(getSavedFilters);

  useEffect(() => {
    const savedFilters = getSavedFilters();

    fetchLogs(savedFilters);
    fetchTeamLeaders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFilters = () => {
    setShowFilters(prev => {
      const newValue = !prev;
      localStorage.setItem(LOG_FILTERS_VISIBLE_KEY, String(newValue));
      return newValue;
    });
  };

  const fetchLogs = async (filtersToUse = filters) => {
    try {
      setLoading(true);

      let response;

      if (user.role === 'admin') {
        response = await logService.getAllLogsAdmin(filtersToUse);
      } else {
        response = await logService.getAllLogs(filtersToUse);
      }

      setLogs(response.data);
      setError('');
    } catch (err) {
      console.error('שגיאה בטעינת הדוחות:', err);
      setError('טעינת הדוחות נכשלה. נסה שוב.');
      toast.error('טעינת הדוחות נכשלה');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLeaders = async () => {
    try {
      const response = await logService.getTeamLeaders();
      setTeamLeaders(response.data);
    } catch (err) {
      console.error('שגיאה בטעינת ראשי צוות:', err);
      toast.error('טעינת ראשי צוות נכשלה');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    console.log('✅ filter changed:', name, value);

    setFilters(prev => {
      const updatedFilters = {
        ...prev,
        [name]: value
      };

      localStorage.setItem(
        LOG_FILTERS_STORAGE_KEY,
        JSON.stringify(updatedFilters)
      );

      return updatedFilters;
    });
  };

  const applyFilters = (e) => {
    e.preventDefault();

    localStorage.setItem(LOG_FILTERS_STORAGE_KEY, JSON.stringify(filters));
    fetchLogs(filters);
  };

  const resetFilters = () => {
    const defaultFilters = getDefaultFilters();

    setFilters(defaultFilters);
    localStorage.removeItem(LOG_FILTERS_STORAGE_KEY);

    fetchLogs(defaultFilters);
  };

  const handleApproveLog = async (id) => {
    try {
      await logService.approveLog(id);
      toast.success('הדו"ח אושר בהצלחה');
      fetchLogs(filters);
    } catch (err) {
      console.error('שגיאה באישור דו"ח:', err);
      toast.error('אישור הדו"ח נכשל');
    }
  };

  return (
    <Container dir="rtl">
      <Row className="mb-4">
        <Col>
          <h2>כל הדוחות היומיים</h2>
          <p className="text-muted">צפה ונהל את כל דוחות הצוות</p>
        </Col>

        <Col xs="auto">
          <Button
            variant="outline-primary"
            onClick={toggleFilters}
            className="mb-2"
          >
            <FaFilter className="me-1" />
            {showFilters ? 'הסתר סינון' : 'הצג סינון'}
          </Button>
        </Col>
      </Row>

      {showFilters && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">סינון דוחות</h5>
          </Card.Header>

          <Card.Body>
            <Form onSubmit={applyFilters}>
              <Row>
                <Col md={6} lg={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>מתאריך</Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={6} lg={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>עד תאריך</Form.Label>
                    <Form.Control
                      type="date"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={6} lg={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>פרויקט</Form.Label>
                    <Form.Control
                      type="text"
                      name="project"
                      value={filters.project}
                      onChange={handleFilterChange}
                      placeholder="הקלד שם פרויקט..."
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>ראש צוות</Form.Label>
                    <Form.Select
                      name="teamLeader"
                      value={filters.teamLeader}
                      onChange={handleFilterChange}
                    >
                      <option value="">כל ראשי הצוות</option>

                      {teamLeaders.map(leader => (
                        <option key={leader._id} value={leader._id}>
                          {leader.fullName}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>חיפוש</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="חפש בתיאור העבודה..."
                        name="searchTerm"
                        value={filters.searchTerm}
                        onChange={handleFilterChange}
                      />

                      <Button variant="outline-secondary" type="submit">
                        <FaSearch />
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-between">
                <Button variant="secondary" onClick={resetFilters}>
                  איפוס סינון
                </Button>

                <Button type="submit" variant="primary">
                  החל סינון
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          {loading ? (
            <p className="text-center">טוען דוחות...</p>
          ) : logs.length === 0 ? (
            <p className="text-center">לא נמצאו דוחות</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>ראש צוות</th>
                  <th>פרויקט</th>
                  <th>שעות עבודה</th>
                  <th>פעולות</th>
                </tr>
              </thead>

              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td>{moment(log.date).format('DD/MM/YYYY')}</td>
                    <td>{log.teamLeader?.fullName || '—'}</td>
                    <td>{log.project}</td>
                    <td>
                      {moment(log.startTime).format('HH:mm')} -{' '}
                      {moment(log.endTime).format('HH:mm')}
                    </td>

                    <td>
                      <Button
                        as={Link}
                        to={`/log-details/${log._id}`}
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        title="צפייה"
                      >
                        <FaEye />
                      </Button>

                      {(user.role === 'Manager' || user.role === 'Team Leader') && (
                        <Button
                          as={Link}
                          to={`/edit-log/${log._id}`}
                          variant="outline-warning"
                          size="sm"
                          className="me-1"
                          title="עריכה"
                        >
                          <FaEdit />
                        </Button>
                      )}

                      {log.status === 'submitted' && user.role === 'admin' && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          title="אישור"
                          onClick={() => handleApproveLog(log._id)}
                        >
                          <FaCheck />
                        </Button>
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

export default AllLogs;