'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LeaveList() {
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const data = JSON.parse(atob(token.split('.')[1]));
      setRole(data.role);
    } catch {}

    fetch('http://localhost:5000/api/leave', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(setLeaves)
      .catch(() => setError('Failed to fetch leave requests'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleApprove = async (id, status) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/leave/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update leave status');
      setLeaves(leaves.map(l => l.id === id ? { ...l, status } : l));
    } catch {
      setError('Failed to update leave status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/leave/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setLeaves(leaves.filter(l => l.id !== id));
    } catch {
      setError('Failed to delete leave request');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-1/4 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 border-b border-gray-100 bg-gray-50 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Leave Requests</h1>
        {role === 'employee' && (
          <Link href="/leave/apply" className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-lg shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Apply for Leave
          </Link>
        )}
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Start</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">End</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {leaves.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                  No leave requests found.
                </td>
              </tr>
            ) : (
              leaves.map(leave => (
                <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-blue-700 font-medium">
                    {leave.Employee?.firstName} {leave.Employee?.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{leave.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{leave.start_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{leave.end_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={
                      leave.status === 'pending' ? 'text-yellow-600 font-semibold' :
                      leave.status === 'approved' ? 'text-green-600 font-semibold' :
                      'text-red-600 font-semibold'
                    }>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                    <Link href={`/leave/${leave.id}`} className="text-indigo-600 hover:text-indigo-900 font-semibold transition">Details</Link>
                    {role !== 'employee' && leave.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(leave.id, 'approved')}
                          className="text-green-600 hover:text-green-900 font-semibold transition">Approve</button>
                        <button onClick={() => handleApprove(leave.id, 'rejected')}
                          className="text-red-600 hover:text-red-900 font-semibold transition">Reject</button>
                      </>
                    )}
                    {(role === 'admin' || role === 'hr' || leave.status !== 'approved') && (
                      <button onClick={() => handleDelete(leave.id)}
                        className="text-red-600 hover:text-red-800 font-semibold transition">Delete</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
