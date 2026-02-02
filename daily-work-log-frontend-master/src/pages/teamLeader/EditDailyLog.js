import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { projectService, employeeService, logService } from '../../services/apiService';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import FileUploader from '../../components/common/FileUploader';
import moment from 'moment';
import * as fileService from '../../services/fileService';


const EditDailyLog = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    fetchLog();
    fetchProjects();
    fetchEmployees();
  }, [id]);

  const fetchLog = async () => {
    try {
      const response = await logService.getLogById(id);
      const log = response.data;
      
      // Format the data for the form
      setInitialValues({
        date: new Date(log.date),
        project: log.project._id,
        employees: log.employees.map(emp => emp._id),
        startTime: new Date(log.startTime),
        endTime: new Date(log.endTime),
        workDescription: log.workDescription,
        weather: log.weather || '',
        issuesEncountered: log.issuesEncountered || '',
        nextSteps: log.nextSteps || '',
        materialsUsed: log.materialsUsed.length > 0 
          ? log.materialsUsed 
          : [{ name: '', quantity: '', unit: '' }]
      });
    } catch (err) {
      console.error('Error fetching log:', err);
      setError('Failed to load the daily log. Please try again.');
      toast.error('Failed to load daily log');
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectService.getActiveProjects();
      setProjects(response.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
      toast.error('Failed to load projects');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getActiveEmployees();
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees. Please try again.');
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  // Validation schema
  const validationSchema = Yup.object({
    date: Yup.date().required('Date is required'),
    project: Yup.string().required('Project is required'),
    employees: Yup.array().min(1, 'At least one employee must be selected'),
    startTime: Yup.date().required('Start time is required'),
    endTime: Yup.date()
      .required('End time is required')
      .test('is-after-start', 'End time must be after start time', function (value) {
        const { startTime } = this.parent;
        return !startTime || !value || value > startTime;
      }),
    workDescription: Yup.string().required('Work description is required'),
    weather: Yup.string(),
    issuesEncountered: Yup.string(),
    nextSteps: Yup.string(),
    materialsUsed: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required('Material name is required'),
        quantity: Yup.number().required('Quantity is required').positive('Quantity must be positive'),
        unit: Yup.string().required('Unit is required')
      })
    )
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Format the data for API
      const formattedValues = {
        ...values,
        date: new Date(values.date).toISOString(),
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString()
      };

      // Update the log
      await logService.updateLog(id, formattedValues);

      // Upload photos if any
      if (photos.length > 0) {
        const photoFormData = new FormData();
        photos.forEach(photo => {
          photoFormData.append('photos', photo);
        });
        await fileService.uploadPhoto(id, photoFormData);
      }

      // Upload documents if any
      if (documents.length > 0) {
        const documentFormData = new FormData();
        documents.forEach(doc => {
          documentFormData.append('documents', doc);
        });
        await fileService.uploadDocument(id, documentFormData);
      }

      toast.success('Daily log updated successfully');
      navigate('/');
    } catch (err) {
      console.error('Error updating log:', err);
      setError('Failed to update daily log. Please try again.');
      toast.error('Failed to update daily log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMaterial = (values, setValues) => {
    setValues({
      ...values,
      materialsUsed: [...values.materialsUsed, { name: '', quantity: '', unit: '' }]
    });
  };

  const handleRemoveMaterial = (index, values, setValues) => {
    const updatedMaterials = [...values.materialsUsed];
    updatedMaterials.splice(index, 1);
    setValues({
      ...values,
      materialsUsed: updatedMaterials
    });
  };

  const handleSubmitLog = async () => {
    try {
      await logService.submitLog(id);
      toast.success('Log submitted successfully');
      navigate('/');
    } catch (err) {
      console.error('Error submitting log:', err);
      toast.error('Failed to submit log');
    }
  };

  if (loading || !initialValues) {
    return <Container><p className="text-center">Loading form...</p></Container>;
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Edit Daily Work Log</h2>
          <p className="text-muted">Update the details of your work log</p>
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
              setValues,
              isSubmitting
            }) => (
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date</Form.Label>
                      <DatePicker
                        selected={values.date}
                        onChange={date => setFieldValue('date', date)}
                        className={`form-control ${touched.date && errors.date ? 'is-invalid' : ''}`}
                        dateFormat="MMMM d, yyyy"
                      />
                      {touched.date && errors.date && (
                        <Form.Control.Feedback type="invalid">
                          {errors.date}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Project</Form.Label>
                      <Form.Select
                        name="project"
                        value={values.project}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.project && errors.project}
                      >
                        <option value="">Select Project</option>
                        {projects.map(project => (
                          <option key={project._id} value={project._id}>
                            {project.name}
                          </option>
                        ))}
                      </Form.Select>
                      {touched.project && errors.project && (
                        <Form.Control.Feedback type="invalid">
                          {errors.project}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Employees Present</Form.Label>
                  <div className="border rounded p-3">
                    {employees.length === 0 ? (
                      <p className="text-muted">No employees available</p>
                    ) : (
                      employees.map(employee => (
                        <Form.Check
                          key={employee._id}
                          type="checkbox"
                          id={`employee-${employee._id}`}
                          label={employee.fullName}
                          checked={values.employees.includes(employee._id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setFieldValue('employees', [...values.employees, employee._id]);
                            } else {
                              setFieldValue(
                                'employees',
                                values.employees.filter(id => id !== employee._id)
                              );
                            }
                          }}
                          className="mb-2"
                        />
                      ))
                    )}
                    {touched.employees && errors.employees && (
                      <div className="text-danger mt-2">{errors.employees}</div>
                    )}
                  </div>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Time</Form.Label>
                      <DatePicker
                        selected={values.startTime}
                        onChange={time => setFieldValue('startTime', time)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="h:mm aa"
                        className={`form-control ${touched.startTime && errors.startTime ? 'is-invalid' : ''}`}
                      />
                      {touched.startTime && errors.startTime && (
                        <Form.Control.Feedback type="invalid">
                          {errors.startTime}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>End Time</Form.Label>
                      <DatePicker
                        selected={values.endTime}
                        onChange={time => setFieldValue('endTime', time)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="h:mm aa"
                        className={`form-control ${touched.endTime && errors.endTime ? 'is-invalid' : ''}`}
                      />
                      {touched.endTime && errors.endTime && (
                        <Form.Control.Feedback type="invalid">
                          {errors.endTime}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Work Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="workDescription"
                    value={values.workDescription}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.workDescription && errors.workDescription}
                  />
                  {touched.workDescription && errors.workDescription && (
                    <Form.Control.Feedback type="invalid">
                      {errors.workDescription}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Weather</Form.Label>
                      <Form.Control
                        type="text"
                        name="weather"
                        value={values.weather}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.weather && errors.weather}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Issues Encountered</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="issuesEncountered"
                        value={values.issuesEncountered}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Next Steps</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="nextSteps"
                        value={values.nextSteps}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Card className="mb-3">
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Materials Used</h5>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleAddMaterial(values, setValues)}
                      >
                        Add Material
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {values.materialsUsed.map((material, index) => (
                      <Row key={index} className="mb-3">
                        <Col md={5}>
                          <Form.Control
                            type="text"
                            placeholder="Material Name"
                            name={`materialsUsed[${index}].name`}
                            value={material.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={
                              touched.materialsUsed?.[index]?.name && 
                              errors.materialsUsed?.[index]?.name
                            }
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Control
                            type="number"
                            placeholder="Quantity"
                            name={`materialsUsed[${index}].quantity`}
                            value={material.quantity}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={
                              touched.materialsUsed?.[index]?.quantity && 
                              errors.materialsUsed?.[index]?.quantity
                            }
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Control
                            type="text"
                            placeholder="Unit"
                            name={`materialsUsed[${index}].unit`}
                            value={material.unit}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={
                              touched.materialsUsed?.[index]?.unit && 
                              errors.materialsUsed?.[index]?.unit
                            }
                          />
                        </Col>
                        <Col md={1}>
                          {index > 0 && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveMaterial(index, values, setValues)}
                            >
                              &times;
                            </Button>
                          )}
                        </Col>
                      </Row>
                    ))}
                  </Card.Body>
                </Card>

                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Upload Photos</Form.Label>
                      <FileUploader
                        accept="image/*"
                        multiple
                        onFilesSelected={files => setPhotos(files)}
                      />
                      <Form.Text className="text-muted">
                        Upload additional photos of the work site and completed tasks
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Upload Documents</Form.Label>
                      <FileUploader
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        onFilesSelected={files => setDocuments(files)}
                      />
                      <Form.Text className="text-muted">
                        Upload additional delivery notes, receipts, invoices, etc.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-between">
                  <Button variant="secondary" onClick={() => navigate('/')}>
                    Cancel
                  </Button>
                  <div>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isSubmitting}
                      className="me-2"
                    >
                      {isSubmitting ? 'Saving...' : 'Save as Draft'}
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => {
                        handleSubmit();
                        handleSubmitLog();
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Save & Submit'}
                    </Button>
                  </div>
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
