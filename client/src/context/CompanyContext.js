import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CompanyContext = createContext();

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany debe ser usado dentro de un CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }) => {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await axios.get('/api/company-info');
        console.log('📋 Información de la empresa obtenida:', response.data);
        setCompanyInfo(response.data);
      } catch (error) {
        console.error('Error fetching company info:', error);
        setCompanyInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, []);

  const refreshCompanyInfo = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/company-info');
      console.log('🔄 Información de la empresa actualizada:', response.data);
      setCompanyInfo(response.data);
    } catch (error) {
      console.error('Error refreshing company info:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    companyInfo,
    loading,
    refreshCompanyInfo
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};
