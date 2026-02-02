import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { logService, fileService } from '../../services/apiService';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/* ================= עובדים ידניים ================= */
const EmployeeInputList = ({ values, setFieldValue }) => (
  <Form.Group className="mb-3">
    <Form.Label>עובדים נוכחים</Form.Label>

    {values.employees.map((employee, index) => (
      <Row key={index} className="mb-2">
        <Col xs={10}>
          <Form.Control
            type="text"
            value={employee}
            placeholder="שם העובד"
            onChange={(e) => {
              const updated = [...values.employees];
              updated[index] = e.target.value;
              setFieldValue('employees', updated);
            }}
          />
        </Col>
        <Col xs={2}>
          <Button
            variant="outline-danger"
            disabled={values.employees.length === 1}
            onClick={() => {
              const updated = values.employees.filter((_, i) => i !== index);
              setFieldValue('employees', updated);
            }}
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
  </Form.Group>
);

/* ================= בחירת שעה ברבע שעה ================= */
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

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Select
        value={current}
        onChange={(e) => {
          const [hh, mm] = e.target.value.split(':').map(Number);
          const next = new Date(value || new Date());
          next.setHours(hh, mm, 0, 0);
          onChange(next);
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

/* ================= EditDailyLog ================= */
const EditDailyLog = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  /* ====== טעינת הדו"ח ====== */
  useEffect(() => {
    const fetchLog = async () => {
      try {
        const { data } = await logService.getLogById(id);

        setInitialValues({
          date: new Date(data.date),
          project: data.project,
          employees: data.employees?.length ? data.employees : [''],
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          workDescription: data.workDescription || '',
          workPhotos: [],
        });
      } catch (err) {
        setError('שגיאה בטעינת הדו״ח');
        toast.error('Failed to load log');
      } finally {
        setLoading(false);
      }
    };

    fetchLog();
  }, [id]);

  /* ====== ולידציה ====== */
  const validationSchema = Yup.object({
    date: Yup.date().required(),
    employees: Yup.array().min(1),
    startTime: Yup.date().required(),
    endTime: Yup.date().required(),
    workDescription: Yup.string().required(),
  });

  /* ====== שליחה ====== */
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');

      const baseDate = new Date(values.date);

      const start = new Date(baseDate);
      start.setHours(values.startTime.getHours(), values.startTime.getMinutes(), 0, 0);

      const end = new Date(baseDate);
      end.setHours(values.endTime.getHours(), values.endTime.getMinutes(), 0, 0);

      const cleanedEmployees = values.employees
        .map(e => e.trim())
        .filter(Boolean);

      const payload = {
        date: baseDate.toISOString(),
        project: values.project,
        employees: JSON.stringify(cleanedEmployees), // ⭐⭐⭐ הכי חשוב ⭐⭐⭐
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        workDescription: values.workDescription,
        status: 'draft',
      };

      await logService.updateLog(id, payload);

      if (values.workPhotos.length > 0) {
        const fd = new FormData();
        values.workPhotos.forEach(f => fd.append('photos', f));
        await fileService.uploadPhoto(id, fd);
      }

      toast.success('הדו״ח עודכן בהצלחה');
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('עדכון הדו״ח נכשל');
      toast.error('Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !initialValues) {
    return <Container><p className="text-center">טוען…</p></Container>;
  }

  return (
    <Container dir="rtl">
      <h2 className="mb-4">עריכת דו״ח עבודה</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, handleSubmit, setFieldValue, isSubmitting }) => (
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Label>תאריך</Form.Label>
                    <DatePicker
                      selected={values.date}
                      onChange={(d) => setFieldValue('date', d)}
                      className="form-control"
                      dateFormat="dd/MM/yyyy"
                    />
                  </Col>

                  <Col md={6}>
                    <Form.Label>פרויקט</Form.Label>
                    <Form.Control value={values.project} readOnly />
                  </Col>
                </Row>

                <EmployeeInputList values={values} setFieldValue={setFieldValue} />

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
                    value={values.workDescription}
                    onChange={(e) => setFieldValue('workDescription', e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>תמונות חדשות</Form.Label>
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
                    שמור
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
