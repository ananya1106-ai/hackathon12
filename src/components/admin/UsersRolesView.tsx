import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  UserCheck,
  Building2,
  Lock,
  ArrowRight,
  Warehouse,
  Truck,
  FileCheck,
  Boxes,
  ShieldAlert,
} from 'lucide-react';

export const UsersRolesView: React.FC = () => {
  const { currentRole, setCurrentRole, addToast } = useApp();

  const handleSwitchRole = (role: UserRole) => {
    setCurrentRole(role);
    addToast('info', 'Active Role Switched', `Operating as simulated "${role}".`);
  };

  const permissions = [
    {
      feature: 'User Provisioning & Role Permissions Governance',
      admin: true,
      operator: false,
      dealer: false,
    },
    {
      feature: 'Depot Storage Parameters & System Settings',
      admin: true,
      operator: false,
      dealer: false,
    },
    {
      feature: 'Record Inward Stock Rake Receipts & QC Inspections',
      admin: true,
      operator: true,
      dealer: false,
    },
    {
      feature: 'Execute Standard Deterministic FIFO Dispatch Allocation',
      admin: true,
      operator: true,
      dealer: false,
    },
    {
      feature: 'Issue Form PDS-12 Digital Delivery Challans & Gate Passes',
      admin: true,
      operator: true,
      dealer: false,
    },
    {
      feature: 'Track Fair Price Shop Transit Delivery & Milestones',
      admin: true,
      operator: true,
      dealer: true,
    },
    {
      feature: 'Request FIFO Out-of-Sequence Exception Override',
      admin: true,
      operator: true,
      dealer: false,
    },
    {
      feature: 'Authorize FIFO Exception & Override Older Batches',
      admin: true,
      operator: false,
      dealer: false,
    },
    {
      feature: 'Conduct Physical Stack Count & Log Variances',
      admin: true,
      operator: true,
      dealer: false,
    },
    {
      feature: 'Authorize Physical Count Stock Ledger Adjustments',
      admin: true,
      operator: false,
      dealer: false,
    },
    {
      feature: 'Modify Batch Status (Eligible / Quarantined / Damaged)',
      admin: true,
      operator: true,
      dealer: false,
    },
    {
      feature: 'Inspect Immutable Cryptographic Audit Ledger & Anomaly Alerts',
      admin: true,
      operator: true,
      dealer: false,
    },
  ];

  const depotStaff: Array<{
    name: string;
    role: UserRole;
    id: string;
    email: string;
    designation: string;
    status: string;
  }> = [
    {
      name: 'Sunil K. Verma',
      role: 'Administrator',
      id: 'EMP-ADM-0001',
      email: 'admin@smartpds.gov.in',
      designation: 'State Systems & Civil Supplies Security Directorate',
      status: 'Active',
    },
    {
      name: 'Rajesh V.',
      role: 'Warehouse Operator',
      id: 'EMP-FCI-0048',
      email: 'operator@smartpds.gov.in',
      designation: 'Senior Technical Assistant & Depot Gate Operator',
      status: 'Active',
    },
    {
      name: 'Shankar Gowda',
      role: 'Ration Shop Dealer',
      id: 'FPS-KA-2804',
      email: 'dealer@smartpds.gov.in',
      designation: 'Fair Price Shop Allotment & Distribution Network',
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#141C29] rounded-xl border border-[#293548] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#480F25] text-[#C4B5FD] rounded border border-[#9F1745]/50 uppercase tracking-wider">
              Access Control & RBAC
            </span>
            <span className="text-xs text-[#98A2B3]">Depot Security Protocol</span>
          </div>
          <h2 className="text-lg font-bold text-[#F1F5F9] mt-1">
            Users, Role Permission Matrix & Role Simulator
          </h2>
          <p className="text-xs text-[#98A2B3] mt-0.5">
            Role-based segregation of duties enforcing governance between Administrators, Warehouse Operators, and Ration Shop Dealers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-[#101827] border border-[#293548] text-[#C4B5FD] text-xs font-semibold flex items-center gap-1.5 font-mono">
            <UserCheck className="w-4 h-4" />
            <span>Active: {currentRole}</span>
          </span>
        </div>
      </div>

      {/* Staff Roster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {depotStaff.map((staff) => {
          const isSelected = currentRole === staff.role;
          return (
            <div
              key={staff.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#101827] border-[#C4B5FD] shadow-sm ring-1 ring-[#C4B5FD]/40'
                  : 'bg-[#141C29] border-[#293548] hover:border-[#C4B5FD]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#98A2B3]">{staff.id}</span>
                  {isSelected ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#9F1745] text-white">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      {staff.status}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <h4 className="text-sm font-bold text-[#F1F5F9] truncate">{staff.name}</h4>
                  <div className="text-xs font-semibold text-[#C4B5FD] mt-0.5 truncate">
                    {staff.role}
                  </div>
                  <div className="text-[11px] text-[#98A2B3] mt-0.5 line-clamp-2 leading-tight">
                    {staff.designation}
                  </div>
                  <div className="text-[10px] font-mono text-[#98A2B3]/70 mt-1 truncate">
                    {staff.email}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#293548]">
                <button
                  type="button"
                  onClick={() => handleSwitchRole(staff.role)}
                  className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#480F25] text-[#C4B5FD] border border-[#9F1745]/50'
                      : 'bg-[#101827] hover:bg-[#9F1745] hover:text-white border border-[#293548] text-[#F1F5F9]'
                  }`}
                >
                  <span>{isSelected ? 'Current Session' : `Switch Role`}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission Matrix Table */}
      <div className="p-5 bg-[#141C29] rounded-xl border border-[#293548] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#293548]">
          <div>
            <h3 className="text-sm font-bold text-[#F1F5F9]">
              Statutory Responsibility & Permission Matrix
            </h3>
            <p className="text-xs text-[#98A2B3] mt-0.5">
              Granular clearance breakdown across all 3 authorized operational roles
            </p>
          </div>
          <span className="text-xs text-[#C4B5FD] font-mono">Dual-Key Enforcement</span>
        </div>

        <div className="overflow-x-auto border border-[#293548] rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#101827] text-[#98A2B3] font-semibold border-b border-[#293548]">
              <tr>
                <th className="py-2.5 px-3">System Operation / Action Capability</th>
                <th className="py-2.5 px-3 text-center">Administrator</th>
                <th className="py-2.5 px-3 text-center">Warehouse Operator</th>
                <th className="py-2.5 px-3 text-center">Ration Shop Dealer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#293548]">
              {permissions.map((p, idx) => (
                <tr key={idx} className="hover:bg-[#1A2333]/60 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-[#F1F5F9]">
                    {p.feature}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {p.admin ? (
                      <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 mx-auto text-slate-600" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {p.operator ? (
                      <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 mx-auto text-slate-600" />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {p.dealer ? (
                      <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 mx-auto text-slate-600" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
