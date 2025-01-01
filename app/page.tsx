'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, isThisMonth } from 'date-fns';
import { FaArrowUp, FaArrowDown, FaEdit, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';

type Installment = {
  id: number;
  name: string;
  startingDate: Date;
  duration: number;
  totalAmount: number;
  months: Array<{
    month: Date;
    amount: number;
    paid: boolean;
  }>;
};

export default function Home() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [newInstallment, setNewInstallment] = useState({
    name: '',
    startingDate: '',
    duration: '',
    totalAmount: '',
  });
  const [expandedInstallmentId, setExpandedInstallmentId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editInstallmentId, setEditInstallmentId] = useState<number | null>(null);

  useEffect(() => {
    const savedInstallments = localStorage.getItem('installments');
    if (savedInstallments) {
      setInstallments(JSON.parse(savedInstallments));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('installments', JSON.stringify(installments));
  }, [installments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewInstallment({
      ...newInstallment,
      [name]: value,
    });
  };

  const handleAddInstallment = () => {
    const newId = installments.length > 0 ? installments[installments.length - 1].id + 1 : 1;
    const startDate = new Date(newInstallment.startingDate);
    const months = [];

    for (let i = 0; i < parseInt(newInstallment.duration); i++) {
      const dueMonth = addMonths(startDate, i);
      months.push({
        month: dueMonth,
        amount: parseFloat(newInstallment.totalAmount) / parseInt(newInstallment.duration),
        paid: false,
      });
    }

    const newInstall = {
      id: newId,
      name: newInstallment.name,
      startingDate: startDate,
      duration: parseInt(newInstallment.duration),
      totalAmount: parseFloat(newInstallment.totalAmount),
      months,
    };

    setInstallments((prev) => [...prev, newInstall]);
    setNewInstallment({ name: '', startingDate: '', duration: '', totalAmount: '' });
    setIsModalOpen(false);
  };

  const handleEditInstallment = () => {
    const startDate = new Date(newInstallment.startingDate);
    const months = [];

    for (let i = 0; i < parseInt(newInstallment.duration); i++) {
      const dueMonth = addMonths(startDate, i);
      months.push({
        month: dueMonth,
        amount: parseFloat(newInstallment.totalAmount) / parseInt(newInstallment.duration),
        paid: false,
      });
    }

    setInstallments((prev) =>
      prev.map((installment) =>
        installment.id === editInstallmentId
          ? {
              ...installment,
              name: newInstallment.name,
              startingDate: startDate,
              duration: parseInt(newInstallment.duration),
              totalAmount: parseFloat(newInstallment.totalAmount),
              months,
            }
          : installment
      )
    );
    setNewInstallment({ name: '', startingDate: '', duration: '', totalAmount: '' });
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditInstallmentId(null);
  };

  const handleTogglePaid = (installmentId: number, monthIndex: number) => {
    setInstallments((prev) =>
      prev.map((installment) =>
        installment.id === installmentId
          ? {
              ...installment,
              months: installment.months.map((month, index) =>
                index === monthIndex ? { ...month, paid: !month.paid } : month
              ),
            }
          : installment
      )
    );
  };

  const handleRemoveInstallment = (installmentId: number) => {
    setInstallments((prev) => prev.filter((installment) => installment.id !== installmentId));
  };

  const toggleExpandCard = (id: number) => {
    if (expandedInstallmentId === id) {
      setExpandedInstallmentId(null);
    } else {
      setExpandedInstallmentId(id);
    }
  };

  const handleEditButtonClick = (installment: Installment) => {
    setNewInstallment({
      name: installment.name,
      startingDate: new Date(installment.startingDate).toISOString().split('T')[0],
      duration: installment.duration.toString(),
      totalAmount: installment.totalAmount.toString(),
    });
    setIsEditMode(true);
    setEditInstallmentId(installment.id);
    setIsModalOpen(true);
  };

  const moveInstallment = (index: number, direction: 'up' | 'down') => {
    setInstallments((prev) => {
      const newInstallments = [...prev];
      if (direction === 'up' && index > 0) {
        const [movedInstallment] = newInstallments.splice(index, 1);
        newInstallments.splice(index - 1, 0, movedInstallment);
      } else if (direction === 'down' && index < newInstallments.length - 1) {
        const [movedInstallment] = newInstallments.splice(index, 1);
        newInstallments.splice(index + 1, 0, movedInstallment);
      }
      return newInstallments;
    });
  };

  const calculateAmountDueThisMonth = () => {
    const currentMonth = new Date();
    let totalDue = 0;

    installments.forEach((installment) => {
      installment.months.forEach((month) => {
        if (isThisMonth(month.month) && !month.paid) {
          totalDue += month.amount;
        }
      });
    });

    return totalDue;
  };

  const calculateAmountDueNextMonth = () => {
    const nextMonth = addMonths(new Date(), 1);
    let totalDue = 0;

    installments.forEach((installment) => {
      installment.months.forEach((month) => {
        if (format(month.month, 'yyyy-MM') === format(nextMonth, 'yyyy-MM') && !month.paid) {
          totalDue += month.amount;
        }
      });
    });

    return totalDue;
  };

  const calculatePaidPercentage = (installment: Installment) => {
    const totalPaid = installment.months.reduce((acc, month) => acc + (month.paid ? month.amount : 0), 0);
    return (totalPaid / installment.totalAmount) * 100;
  };

  const calculateTotalAmount = () => {
    return installments.reduce((acc, installment) => acc + installment.totalAmount, 0);
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(installments, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'installments.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const importedData = JSON.parse(event.target?.result as string);
        setInstallments(importedData);
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <div className="navbar">
        <button className="add-installment-button" onClick={() => setIsModalOpen(true)}>
          {isEditMode ? 'Edit Installment' : 'Add New Installment'}
        </button>
        <button className="export-button" onClick={handleExportData}>
          Export Data
        </button>
        <label htmlFor="file-upload" className="custom-file-upload">
          Import Data
        </label>
        <input id="file-upload" type="file" className="import-button" onChange={handleImportData} />
      </div>
      <div className="container">
        <h1>Installment Tracker</h1>

        {/* Modal for adding/editing an installment */}
        {isModalOpen && (
          <div className="modal" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <span className="close" onClick={() => setIsModalOpen(false)}>
                &times;
              </span>
              <h2>{isEditMode ? 'Edit Installment' : 'Add New Installment'}</h2>
              <input
                type="text"
                name="name"
                value={newInstallment.name}
                onChange={handleInputChange}
                placeholder="Installment Name"
              />
              <input
                type="date"
                name="startingDate"
                value={newInstallment.startingDate}
                onChange={handleInputChange}
              />
              <input
                type="number"
                name="duration"
                value={newInstallment.duration}
                onChange={handleInputChange}
                placeholder="Duration (months)"
              />
              <input
                type="number"
                name="totalAmount"
                value={newInstallment.totalAmount}
                onChange={handleInputChange}
                placeholder="Total Amount"
              />
              <button onClick={isEditMode ? handleEditInstallment : handleAddInstallment}>
                {isEditMode ? 'Save Changes' : 'Add Installment'}
              </button>
            </div>
          </div>
        )}

        {/* Installments List */}
        <div>
          <h2>Installments List</h2>
          {installments.length === 0 ? (
            <p>No installments added yet</p>
          ) : (
            installments.map((installment, index) => (
              <div key={installment.id} className="installment-card">
                <div className="installment-header">
                  <div className="installment-actions">
                    <button onClick={() => handleEditButtonClick(installment)}>
                      <FaEdit />
                    </button>
                    <button onClick={() => handleRemoveInstallment(installment.id)}>
                      <FaTrash />
                    </button>
                    {index > 0 && (
                      <button onClick={() => moveInstallment(index, 'up')}>
                        <FaArrowUp />
                      </button>
                    )}
                    {index < installments.length - 1 && (
                      <button onClick={() => moveInstallment(index, 'down')}>
                        <FaArrowDown />
                      </button>
                    )}
                    <button onClick={() => toggleExpandCard(installment.id)}>
                      {expandedInstallmentId === installment.id ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>
                  <div className="installment-info">
                    <h3 onClick={() => toggleExpandCard(installment.id)}>{`${index + 1}. ${installment.name}`}</h3>
                    <span onClick={() => toggleExpandCard(installment.id)}>{`Total: ${installment.totalAmount} EGP`}</span>
                    <span onClick={() => toggleExpandCard(installment.id)}>{`Monthly: ${(installment.totalAmount / installment.duration).toFixed(2)} EGP`}</span>
                    <span onClick={() => toggleExpandCard(installment.id)}>{`Duration: ${installment.duration} months`}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${calculatePaidPercentage(installment)}%`, backgroundColor: '#28a745' }}
                  >
                    <span className="progress-bar-text" style={{ color: 'black' }}>{calculatePaidPercentage(installment).toFixed(2)}%</span>
                  </div>
                </div>

                {/* Expandable Table */}
                {expandedInstallmentId === installment.id && (
                  <div className="installment-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Amount</th>
                          <th>Paid?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {installment.months.map((month, monthIndex) => (
                          <tr key={`${installment.id}-${monthIndex}`}>
                            <td>{format(month.month, 'MMM yyyy')}</td>
                            <td>{month.amount.toFixed(2)} EGP</td>
                            <td>
                              <button onClick={() => handleTogglePaid(installment.id, monthIndex)}>
                                {month.paid ? 'Paid' : 'Mark as Paid'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Total Amount Due This Month */}
        <div className="total-due">
          <h3>Total Amount Due This Month: {calculateAmountDueThisMonth().toFixed(2)} EGP</h3>
          <h3>Total Amount Due Next Month: {calculateAmountDueNextMonth().toFixed(2)} EGP</h3>
          <h3>Total Amount of All Installments: {calculateTotalAmount().toFixed(2)} EGP</h3>
        </div>
      </div>
    </>
  );
}
