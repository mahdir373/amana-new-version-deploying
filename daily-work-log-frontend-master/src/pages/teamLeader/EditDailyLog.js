import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { logService, fileService, employeeService, projectService } from '../../services/apiService';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// פונקציית עזר לעובדים ידניים
const EmployeeInputList = ({ values, setFieldValue, errors, touched }) => {
  return (
    <Form.Group className="mb-3">
      <Form.Label>עובדים נוכחים</Form.Label>
      {values.employees.map((employee, index) => (
        <Row key={index} className="mb-2">
          <Col xs={10}>
            <Form.Control
              type="text"
              name={`employees[${index}]`}
              value={employee}
              onChange={(e) => {
                const updated = [...values.employees];
                updated[index] = e.target.value;
                setFieldValue('employees', updated);
              }}
              placeholder="שם העובד"
            />
          </Col>
          <Col xs={2}>
            <Button
              variant="outline-danger"
              onClick={() => {
                const updated = [...values.employees];
                updated.splice(index, 1);
                setFieldValue('employees', updated);
              }}
              disabled={values.employees.length === 1}
            >
              ✕
            </Button>
          </Col>
        </Row>
      ))}
      <Button
        variant="outline-primary"
        onClick={() => setFieldValue('employees', [...values.employees, ''])}
      >
        הוסף עובד
      </Button>
      {touched.employees && errors.employees && (
        <div className="text-danger mt-1">{errors.employees}</div>
      )}
    </Form.Group>
  );
};

// קומפוננטה לבחירת שעות ברבעי שעה
const QuarterHourSelectTimePicker = ({ label, value, onChange }) => {
  const pad2 = (n) => String(n).padStart(2, '0');
  const h = value ? value.getHours() : 0;
  const m = value ? value.getMinutes() : 0;
  const hhmmOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    [0, 15, 30, 45].forEach((min) => {
      hhmmOptions.push({ label: `${pad2(hour)}:${pad2(min)}`, hour, min });
    });
  }
  const handleHHMMChange = (e) => {
    const [HH, MM] = e.target.value.split(':').map(Number);
    const next = value ? new Date(value) : new Date();
    next.setHours(HH, MM, 0, 0);
    onChange(next);
  };
  const currentHHMM = `${pad2(h)}:${pad2(m - (m % 15))}`;
  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Select value={currentHHMM} onChange={handleHHMMChange}>
        {hhmmOptions.map(({ label, hour, min }) => (
          <option key={`${hour}-${min}`} value={`${pad2(hour)}:${pad2(min)}`}>
            {label}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

const EditDailyLog = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [initialValues, setInitialValues] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  // טעינת הדו"ח הקיים
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logRes, projectsRes] = await Promise.all([
          logService.getLogById(id),
          projectService.getActiveProjects(),
        ]);
        const log = logRes.data;
        setProjects(projectsRes.data);

        setInitialValues({
          date: log.date ? new Date(log.date) : new Date(),
          project: log.project || '',
          employees: log.employees.length ? log.employees : [''],
          startTime: log.startTime ? new Date(log.startTime) : new Date(),
          endTime: log.endTime ? new Date(log.endTime) : new Date(),
          workDescription: log.workDescription || '',
          workHours: log.workHours || 0,
          workPhotos: [], // קבצים חדשים ל-upload
          photos: log.photos || [],
          documents: log.documents || [],
          status: log.status || 'draft',
        });
      } catch (err) {
        console.error('Error fetching log:', err);
        setError('לא ניתן לטעון את הדו"ח. אנא נסה שוב.');
        toast.error('Failed to load daily log');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const validationSchema = Yup.object({
    date: Yup.date().required('יש להזין תאריך'),
    project: Yup.string().required('יש להזין שם פרויקט'),
    employees: Yup.array().min(1, 'יש להזין לפחות עובד אחד'),
    startTime: Yup.date().required('יש להזין שעת התחלה'),
    endTime: Yup.date().required('יש להזין שעת סיום'),
    workDescription: Yup.string().required('יש להזין תיאור עבודה'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');

      const { workPhotos, photos, documents, ...rest } = values;

      // יצירת start/end אמיתיים על בסיס התאריך
      const baseDate = new Date(values.date);
      const start = new Date(baseDate);
      start.setHours(values.startTime.getHours(), values.startTime.getMinutes(), 0, 0);
      const end = new Date(baseDate);
      end.setHours(values.endTime.getHours(), values.endTime.getMinutes(), 0, 0);

      const payload = {
        ...rest,
        employees: rest.employees.filter((e) => e && e.trim() !== ''),
        date: new Date(values.date).toISOString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };

      // עדכון הדו"ח הקיים
      await logService.updateLog(id, payload);

      // העלאת תמונות חדשות
      if (workPhotos && workPhotos.length > 0) {
        const formData = new FormData();
        workPhotos.forEach((file) => formData.append('photos', file));
        await fileService.uploadPhoto(id, formData);
      }

      toast.success('דו"ח עודכן בהצלחה');
      navigate('/');
    } catch (err) {
      console.error('Error updating log:', err);
      setError('נכשל בעדכון הדו"ח. אנא נסה שוב.');
      toast.error('Failed to update daily log');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !initialValues) return <Container><p className="text-center">טוען את הטופס...</p></Container>;

  return (
    <Container dir="rtl">
      <Row className="mb-4">
        <Col>
          <h2>עריכת דו"ח עבודה יומי</h2>
          <p className="text-muted">עדכן את פרטי העבודה שבוצעה</p>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, isSubmitting }) => (
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>תאריך</Form.Label>
                      <DatePicker
                        selected={values.date}
                        onChange={(date) => setFieldValue('date', date)}
                        className={`form-control ${touched.date && errors.date ? 'is-invalid' : ''}`}
                        dateFormat="dd/MM/yyyy"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>שם פרויקט</Form.Label>
                      <Form.Select
                        name="project"
                        value={values.project}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.project && !!errors.project}
                      >
                        <option value="">בחר פרויקט</option>
                        {projects.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <EmployeeInputList
                  values={values}
                  setFieldValue={setFieldValue}
                  errors={errors}
                  touched={touched}
                />

                <Row>
                  <Col md={6}>
                    <QuarterHourSelectTimePicker
                      label="שעת התחלה"
                      value={values.startTime}
                      onChange={(d) => setFieldValue('startTime', d)}
                    />
                  </Col>
                  <Col md={6}>
                    <QuarterHourSelectTimePicker
                      label="שעת סיום"
                      value={values.endTime}
                      onChange={(d) => setFieldValue('endTime', d)}
                    />
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>תיאור העבודה</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="workDescription"
                    value={values.workDescription}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.workDescription && !!errors.workDescription}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>צרף תמונות חדשות</Form.Label>
                  <Form.Control
                    type="file"
                    name="workPhotos"
                    accept="image/*"
                    multiple
                    onChange={(e) => setFieldValue('workPhotos', Array.from(e.currentTarget.files))}
                  />
                  {values.workPhotos.length > 0 && (
                    <ul className="mt-2">
                      {values.workPhotos.map((f, i) => (
                        <li key={i}>{f.name}</li>
                      ))}
                    </ul>
                  )}
                </Form.Group>

                <div className="d-flex justify-content-between">
                  <Button variant="secondary" onClick={() => navigate('/')}>
                    ביטול
                  </Button>
                  <Button variant="success" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'שומר...' : 'שמור עדכון'}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditDailyLog;
