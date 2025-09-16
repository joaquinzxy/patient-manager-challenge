import { useEffect } from 'react';
import { Heart } from 'lucide-react';
import { usePatients } from './hooks/usePatients';
import { PatientForm } from './components/PatientForm';
import { PatientList } from './components/PatientList';
import { ErrorAlert } from './components/ErrorAlert';
import './App.css';

function App() {
  const {
    patients,
    loading,
    error,
    pagination,
    fetchPatients,
    createPatient,
    deletePatient,
    clearError,
  } = usePatients();

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleCreatePatient = async (patientData, imageFile) => {
    await createPatient(patientData, imageFile);
    fetchPatients();
  };

  const handleDeletePatient = async (id) => {
    await deletePatient(id);
  };

  const handleRefresh = () => {
    fetchPatients();
  };

  const handlePageChange = (page) => {
    fetchPatients({ page });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Patient Manager
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your patients efficiently
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {patients.length} patient{patients.length !== 1 ? 's' : ''} registered
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        <ErrorAlert message={error} onClose={clearError} />

        {/* Grid Layout: Form on left, List on right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Patient Form */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <PatientForm 
              onSubmit={handleCreatePatient} 
              loading={loading}
            />
          </div>

          {/* Patient List */}
          <div>
            <PatientList
              patients={patients}
              loading={loading}
              onDelete={handleDeletePatient}
              onRefresh={handleRefresh}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            Patient Manager - Built with React & NestJS
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
