import { useState, useCallback } from 'react';
import { patientService } from '../services/patientService';

export const usePatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 3,
    total: 0,
    totalPages: 0,
  });

  const fetchPatients = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await patientService.getPatients(params);
      setPatients(response.data || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 3,
        total: response.total || 0,
        totalPages: response.totalPages || 0,
      });
    } catch (err) {
      setError(err.message);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPatient = useCallback(async (patientData, imageFile = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const newPatient = await patientService.createPatient(patientData, imageFile);
      setPatients(prev => [newPatient, ...prev]);
      return newPatient;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePatient = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await patientService.deletePatient(id);
      setPatients(prev => prev.filter(patient => patient.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    patients,
    loading,
    error,
    pagination,
    fetchPatients,
    createPatient,
    deletePatient,
    clearError,
  };
};
