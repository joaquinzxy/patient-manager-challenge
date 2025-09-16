import api from './api.js';

export const patientService = {
  getPatients: async (params = {}) => {
    try {
      const response = await api.get('/patients', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch patients');
    }
  },

  getPatient: async (id) => {
    try {
      const response = await api.get(`/patients/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch patient');
    }
  },

  createPatient: async (patientData, imageFile = null) => {
    try {
      const formData = new FormData();
      
      Object.keys(patientData).forEach(key => {
        if (patientData[key] !== undefined && patientData[key] !== null) {
          formData.append(key, patientData[key]);
        }
      });

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await api.post('/patients', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create patient');
    }
  },

  updatePatient: async (id, patientData) => {
    try {
      const response = await api.patch(`/patients/${id}`, patientData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update patient');
    }
  },

  deletePatient: async (id) => {
    try {
      const response = await api.delete(`/patients/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete patient');
    }
  }
};
