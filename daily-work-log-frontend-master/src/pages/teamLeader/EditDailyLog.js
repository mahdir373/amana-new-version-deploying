import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { logService, fileService } from '../../services/apiService';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/* =========================
   עובדים – קלט ידני
========================= */
const EmployeeInputList = ({ values, setFieldValue, errors, touched }) => {
  const employees = values.employees || [];

  const updateEmployee = (index, value) => {
    const updated = [...employees];
    updated[index] = value;
    setFieldValue('employees', updated);
  };

  const removeEmployee = (index) => {
    const updated = [...employees];
    updated.splice(index, 1);
    setFieldValue('employees', updated.length ? updated : ['']);
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>עובדים נוכחים</Form.Label>

      {employees.map((employee, index) => (
        <Row key={index} className="mb-2">
          <Col xs={10}>
            <Form.Control
              type="text"
              value={employee}
              placeholder="שם העובד"
              onChange={(e) => updateEmployee(index, e.target.value)}
            />
          </Col>
          <Col xs={2}>
            <Button
              variant="outline-danger"
              onClick={() => removeEmployee(index)}
              disabled={employees.length === 1}
            >
              ✕
            </Button>
          </Col>
        </Row>
      ))}

      <Button
        variant="outline-primary"
        onClick={() => setFieldValue('employees', [...employees, ''])}
      >
        הוסף עובד
      </Button>

      {touched.employees && errors.employees && (
        <div className="text-danger mt-1">{errors.employees}</div>
      )}
    </Form.Group>
  );
};

/* =========================
   בחירת שעה – רבעי שעה
========================= */
const QuarterHourSelectTimePicker = ({ label, value, onChange }) => {
  const pad = (n) => String(n).padStart(2, '0');

  const options = [];
  for (let h = 0; h < 24; h++) {
    [0, 15, 30, 45].forEach((m) => {
      options.push(`${pad(h)}:${pad(m)}`);
    });
  }

  const current =
    value instanceof Date
      ? `${pad(value.getHours())}:${pad(value.getMinutes() - (value.getMinutes() % 15))}`
      : '00:00';

  const handleChange = (e) => {
    const [h, m] = e.target.value.split(':').map(Number);
    const next = value ? new Date(value) : new Date();
    next.setHours(h, m, 0, 0);
    onChange(next);
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Select value={current} onChange={handleChange}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

/* =========================
   Edit Daily Log
========================= */
const EditDailyLog = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ---------- טעינת הדו״ח ---------- */
  useEffect(() => {
    const fetchLog = async () => {
      try {
        const { data: log } = await logService.getLogById(id);

        setInitialValues({
          date: log.date ? new Date(log.date) : new Date(),
          project: log.project || '',
          employees: log.employees?.length ? log.employees : [''],
          startTime: log.startTime ? new Date(log.startTime) : new Date(),
          endTime: log.endTime ? new Date(log.endTime) : new Date(),
          workDescription: log.workDescription || '',
          workHours: log.workHours || 0,
          workPhotos: [],
          photos: log.photos || [],
          documents: log.documents || [],
          status: log.status || 'draft',
        });
      } catch (err) {
        console.error(err);
        setError('לא ניתן לטעון את הדו״ח');
        toast.error('שגיאה בטעינת הדו״ח');
      } finally {
        setLoading(false);
      }
    };

    fetchLog();
  }, [id]);

  /* ---------- ולידציה ---------- */
  const validationSchema = Yup.object({
    date: Yup.date().required('יש להזין תאריך'),
    project: Yup.string().required(),
    employees: Yup.array()
      .of(Yup.string().trim().required())
      .min(1, 'יש להזין לפחות עובד אחד'),
    startTime: Yup.date().required('יש להזין שעת התחלה'),
    endTime: Yup.date().required('יש להזין שעת סיום'),
    workDescription: Yup.string().required('יש להזין תיאור עבודה'),
  });

  /* ---------- שליחה ---------- */
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');

      const baseDate = new Date(values.date);

      const start = new Date(baseDate);
      start.setHours(values.startTime.getHours(), values.startTime.getMinutes(), 0, 0);

      const end = new Date(baseDate);
      end.setHours(values.endTime.getHours(), values.endTime.getMinutes(), 0, 0);

      const payload = {
        ...values,
        employees: values.employees.filter((e) => e.trim()),
        date: baseDate.toISOString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };

      delete payload.workPhotos;

      await logService.updateLog(id, payload);

      if (values.workPhotos?.length) {
        const formData = new FormData();
        values.workPhotos.forEach((file) => formData.append('photos', file));
        await fileService.uploadPhoto(id, formData);
      }

      toast.success('הדו״ח עודכן בהצלחה');
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('שגיאה בעדכון הדו״ח');
      toast.error('העדכון נכשל');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !initialValues) {
    return (
      <Container>
        <p className="text-center">טוען טופס...</p>
      </Container>
    );
  }

  return (
    <Container dir="rtl">
      <Row className="mb-4">
        <Col>
          <h2>עריכת דו״ח עבודה יומי</h2>
          <p className="text-muted">עדכון פרטי העבודה</p>
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
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              setFieldValue,
              isSubmitting,
            }) => (
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>תאריך</Form.Label>
                      <DatePicker
                        selected={values.date}
                        onChange={(d) => setFieldValue('date', d)}
                        className={`form-control ${
                          touched.date && errors.date ? 'is-invalid' : ''
                        }`}
                        dateFormat="dd/MM/yyyy"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>שם פרויקט</Form.Label>
                      <Form.Control type="text" value={values.project} readOnly />
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
                    isInvalid={touched.workDescription && errors.workDescription}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>צרף תמונות חדשות</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) =>
                      setFieldValue('workPhotos', Array.from(e.target.files))
                    }
                  />
                </Form.Group>

                <div className="d-flex justify-content-between">
                  <Button variant="secondary" onClick={() => navigate('/')}>
                    ביטול
                  </Button>
                  <Button type="submit" variant="success" disabled={isSubmitting}>
                    {isSubmitting ? 'שומר…' : 'שמור עדכון'}
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
