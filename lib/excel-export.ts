import ExcelJS from 'exceljs';
import type { Employee, Attendance, Credit, Task } from './types';

interface EmployeeExportData {
  employee: Employee;
  attendance: Attendance[];
  credits: Credit[];
  tasks: Task[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    totalCredits: number;
    unpaidCredits: number;
    totalCreditAmount: number;
    unpaidCreditAmount: number;
    presentDays: number;
    absentDays: number;
    halfDays: number;
    attendancePercentage: string;
    baseSalary: number;
    leaveDeduction: number;
    creditDeduction: number;
    netSalary: number;
  };
}

export async function exportEmployeeToExcel(data: EmployeeExportData) {
  const { employee, attendance, credits, tasks, stats } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Karigar Employee Management';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Summary');
  
  // Title with background color
  summarySheet.mergeCells('A1:H1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'EMPLOYEE PERFORMANCE REPORT';
  titleCell.font = { size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }
  };
  summarySheet.getRow(1).height = 35;

  // Personal Info Section with styling
  summarySheet.mergeCells('A3:H3');
  const personalHeader = summarySheet.getCell('A3');
  personalHeader.value = 'PERSONAL INFORMATION';
  personalHeader.font = { size: 14, bold: true, color: { argb: 'FF1F2937' } };
  personalHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' }
  };
  personalHeader.alignment = { horizontal: 'left', vertical: 'middle' };
  summarySheet.getRow(3).height = 25;

  const personalInfo = [
    ['Name:', employee.name],
    ['Employee ID:', employee.id],
    ['Role:', employee.role],
    ['Email:', employee.email || 'Not provided'],
    ['Mobile:', employee.mobile || 'Not provided'],
    ['Joining Date:', new Date(employee.joiningDate).toLocaleDateString()],
    ['Status:', employee.status]
  ];

  personalInfo.forEach((row, index) => {
    const rowNum = 4 + index;
    const labelCell = summarySheet.getCell(`A${rowNum}`);
    const valueCell = summarySheet.getCell(`B${rowNum}`);
    
    labelCell.value = row[0];
    labelCell.font = { bold: true, color: { argb: 'FF374151' } };
    labelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF9FAFB' }
    };
    
    valueCell.value = row[1];
    valueCell.font = { color: { argb: 'FF1F2937' } };
    
    summarySheet.getRow(rowNum).height = 20;
  });

  // Performance Metrics with KPI cards
  const metricsRow = 4 + personalInfo.length + 1;
  summarySheet.mergeCells(`A${metricsRow}:H${metricsRow}`);
  const metricsHeader = summarySheet.getCell(`A${metricsRow}`);
  metricsHeader.value = 'KEY PERFORMANCE INDICATORS';
  metricsHeader.font = { size: 14, bold: true, color: { argb: 'FF1F2937' } };
  metricsHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' }
  };
  metricsHeader.alignment = { horizontal: 'left', vertical: 'middle' };
  summarySheet.getRow(metricsRow).height = 25;

  const taskCompletionRate = stats.totalTasks > 0 ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1) : '0';
  
  const metrics = [
    ['Attendance Rate:', `${stats.attendancePercentage}%`, parseFloat(stats.attendancePercentage)],
    ['Task Completion Rate:', `${taskCompletionRate}%`, parseFloat(taskCompletionRate)],
    ['Present Days:', stats.presentDays, null],
    ['Absent Days:', stats.absentDays, null],
    ['Half Days:', stats.halfDays, null],
    ['Total Tasks:', stats.totalTasks, null],
    ['Completed Tasks:', stats.completedTasks, null],
    ['Pending Tasks:', stats.pendingTasks, null],
    ['Overdue Tasks:', stats.overdueTasks, null]
  ];

  metrics.forEach((row, index) => {
    const rowNum = metricsRow + 1 + index;
    const labelCell = summarySheet.getCell(`A${rowNum}`);
    const valueCell = summarySheet.getCell(`B${rowNum}`);
    
    labelCell.value = row[0];
    labelCell.font = { bold: true, color: { argb: 'FF374151' } };
    labelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF9FAFB' }
    };
    
    valueCell.value = row[1];
    valueCell.font = { size: 11, color: { argb: 'FF1F2937' } };
    
    // Color coding for performance
    if (row[2] !== null && typeof row[2] === 'number') {
      if (row[2] >= 90) {
        valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        valueCell.font = { size: 11, bold: true, color: { argb: 'FF065F46' } };
      } else if (row[2] >= 75) {
        valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        valueCell.font = { size: 11, bold: true, color: { argb: 'FF92400E' } };
      } else {
        valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
        valueCell.font = { size: 11, bold: true, color: { argb: 'FF991B1B' } };
      }
    }
    
    summarySheet.getRow(rowNum).height = 20;
  });

  // Salary Section with visual breakdown
  const salaryRow = metricsRow + metrics.length + 2;
  summarySheet.mergeCells(`A${salaryRow}:H${salaryRow}`);
  const salaryHeader = summarySheet.getCell(`A${salaryRow}`);
  salaryHeader.value = 'SALARY BREAKDOWN';
  salaryHeader.font = { size: 14, bold: true, color: { argb: 'FF1F2937' } };
  salaryHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' }
  };
  salaryHeader.alignment = { horizontal: 'left', vertical: 'middle' };
  summarySheet.getRow(salaryRow).height = 25;

  const salaryInfo = [
    ['Base Salary:', `₹${stats.baseSalary.toLocaleString()}`, 'FFD1FAE5'],
    ['Credit Deduction:', `₹${stats.creditDeduction.toLocaleString()}`, 'FFFECACA'],
    ['Leave Deduction:', `₹${stats.leaveDeduction.toLocaleString()}`, 'FFFECACA'],
    ['Total Deductions:', `₹${(stats.creditDeduction + stats.leaveDeduction).toLocaleString()}`, 'FFFED7D7'],
    ['Net Salary:', `₹${stats.netSalary.toLocaleString()}`, 'FFBFDBFE']
  ];

  salaryInfo.forEach((row, index) => {
    const rowNum = salaryRow + 1 + index;
    const labelCell = summarySheet.getCell(`A${rowNum}`);
    const valueCell = summarySheet.getCell(`B${rowNum}`);
    
    labelCell.value = row[0];
    labelCell.font = { bold: true, size: 11, color: { argb: 'FF374151' } };
    labelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF9FAFB' }
    };
    
    valueCell.value = row[1];
    valueCell.font = { size: 11, bold: index === salaryInfo.length - 1, color: { argb: 'FF1F2937' } };
    valueCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: row[2] }
    };
    
    if (index === salaryInfo.length - 1) {
      labelCell.font = { size: 12, bold: true, color: { argb: 'FF1E40AF' } };
      valueCell.font = { size: 12, bold: true, color: { argb: 'FF1E40AF' } };
    }
    
    summarySheet.getRow(rowNum).height = 22;
  });

  // Add Analytics Summary
  const analyticsRow = salaryRow + salaryInfo.length + 2;
  summarySheet.mergeCells(`D${analyticsRow}:H${analyticsRow}`);
  const analyticsHeader = summarySheet.getCell(`D${analyticsRow}`);
  analyticsHeader.value = 'QUICK INSIGHTS';
  analyticsHeader.font = { size: 12, bold: true, color: { argb: 'FF7C3AED' } };
  analyticsHeader.alignment = { horizontal: 'center' };
  
  const attendanceRate = parseFloat(stats.attendancePercentage);
  const insights = [
    `✓ ${attendanceRate >= 90 ? 'Excellent' : attendanceRate >= 75 ? 'Good' : 'Needs Improvement'} Attendance`,
    `✓ ${stats.completedTasks} of ${stats.totalTasks} Tasks Completed`,
    `✓ ${stats.unpaidCredits} Unpaid Credits`,
    `✓ ₹${stats.unpaidCreditAmount.toLocaleString()} Outstanding Amount`
  ];
  
  insights.forEach((insight, index) => {
    const insightRow = analyticsRow + 1 + index;
    summarySheet.mergeCells(`D${insightRow}:H${insightRow}`);
    const cell = summarySheet.getCell(`D${insightRow}`);
    cell.value = insight;
    cell.font = { size: 10, color: { argb: 'FF6B7280' } };
    cell.alignment = { horizontal: 'left' };
  });

  summarySheet.getColumn(1).width = 25;
  summarySheet.getColumn(2).width = 25;
  summarySheet.getColumn(3).width = 15;
  summarySheet.getColumn(4).width = 15;
  summarySheet.getColumn(5).width = 15;
  summarySheet.getColumn(6).width = 15;
  summarySheet.getColumn(7).width = 15;
  summarySheet.getColumn(8).width = 15;

  // Attendance Sheet with enhanced analytics
  const attendanceSheet = workbook.addWorksheet('Attendance Analysis');
  
  // Title
  attendanceSheet.mergeCells('A1:F1');
  const attTitle = attendanceSheet.getCell('A1');
  attTitle.value = 'ATTENDANCE RECORDS & ANALYTICS';
  attTitle.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  attTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  attTitle.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' }
  };
  attendanceSheet.getRow(1).height = 30;

  // Summary Stats
  const attStats = [
    ['Total Days:', attendance.length],
    ['Present:', stats.presentDays],
    ['Absent:', stats.absentDays],
    ['Half Days:', stats.halfDays],
    ['Attendance Rate:', `${stats.attendancePercentage}%`]
  ];

  attStats.forEach((stat, index) => {
    attendanceSheet.getCell(2, index * 2 + 1).value = stat[0];
    attendanceSheet.getCell(2, index * 2 + 1).font = { bold: true, size: 9 };
    attendanceSheet.getCell(3, index * 2 + 1).value = stat[1];
    attendanceSheet.getCell(3, index * 2 + 1).font = { size: 12, bold: true, color: { argb: 'FF059669' } };
    attendanceSheet.getCell(3, index * 2 + 1).alignment = { horizontal: 'center' };
  });

  // Headers
  const attendanceHeaders = ['Date', 'Status', 'Day', 'Time', 'Month', 'Notes'];
  attendanceHeaders.forEach((header, index) => {
    const cell = attendanceSheet.getCell(5, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF374151' }
    };
  });
  attendanceSheet.getRow(5).height = 25;

  // Data rows with conditional formatting
  attendance.forEach((record, index) => {
    const rowNum = 6 + index;
    const date = new Date(record.date);
    
    attendanceSheet.getCell(rowNum, 1).value = date.toLocaleDateString();
    attendanceSheet.getCell(rowNum, 1).alignment = { horizontal: 'center' };
    
    const statusCell = attendanceSheet.getCell(rowNum, 2);
    statusCell.value = record.status.replace('-', ' ').toUpperCase();
    statusCell.alignment = { horizontal: 'center' };
    statusCell.font = { bold: true };
    
    // Color code status
    if (record.status === 'present') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      statusCell.font = { bold: true, color: { argb: 'FF065F46' } };
    } else if (record.status === 'half-day') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      statusCell.font = { bold: true, color: { argb: 'FF92400E' } };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
      statusCell.font = { bold: true, color: { argb: 'FF991B1B' } };
    }
    
    attendanceSheet.getCell(rowNum, 3).value = date.toLocaleDateString('en-US', { weekday: 'long' });
    attendanceSheet.getCell(rowNum, 3).alignment = { horizontal: 'center' };
    
    attendanceSheet.getCell(rowNum, 4).value = new Date(record.createdAt).toLocaleTimeString();
    attendanceSheet.getCell(rowNum, 4).alignment = { horizontal: 'center' };
    
    attendanceSheet.getCell(rowNum, 5).value = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    attendanceSheet.getCell(rowNum, 5).alignment = { horizontal: 'center' };
    
    attendanceSheet.getCell(rowNum, 6).value = record.status === 'present' ? '✓ On Time' : record.status === 'half-day' ? '⚠ Half Day' : '✗ Absent';
    attendanceSheet.getCell(rowNum, 6).alignment = { horizontal: 'center' };
    
    attendanceSheet.getRow(rowNum).height = 20;
  });

  attendanceSheet.getColumn(1).width = 18;
  attendanceSheet.getColumn(2).width = 18;
  attendanceSheet.getColumn(3).width = 18;
  attendanceSheet.getColumn(4).width = 18;
  attendanceSheet.getColumn(5).width = 22;
  attendanceSheet.getColumn(6).width = 20;

  // Tasks Sheet with enhanced analytics
  const tasksSheet = workbook.addWorksheet('Task Management');
  
  // Title
  tasksSheet.mergeCells('A1:G1');
  const taskTitle = tasksSheet.getCell('A1');
  taskTitle.value = 'TASK MANAGEMENT & PROGRESS';
  taskTitle.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  taskTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  taskTitle.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF8B5CF6' }
  };
  tasksSheet.getRow(1).height = 30;

  // Task Summary
  const taskSummary = [
    ['Total Tasks:', stats.totalTasks],
    ['Completed:', stats.completedTasks],
    ['Pending:', stats.pendingTasks],
    ['Overdue:', stats.overdueTasks],
    ['Completion Rate:', `${stats.totalTasks > 0 ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1) : 0}%`]
  ];

  taskSummary.forEach((item, index) => {
    const col = index * 2 + 1;
    tasksSheet.getCell(2, col).value = item[0];
    tasksSheet.getCell(2, col).font = { bold: true, size: 9 };
    tasksSheet.getCell(3, col).value = item[1];
    tasksSheet.getCell(3, col).font = { size: 12, bold: true, color: { argb: 'FF7C3AED' } };
    tasksSheet.getCell(3, col).alignment = { horizontal: 'center' };
  });

  // Headers
  const taskHeaders = ['Title', 'Description', 'Priority', 'Deadline', 'Status', 'Created', 'Days'];
  taskHeaders.forEach((header, index) => {
    const cell = tasksSheet.getCell(5, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF374151' }
    };
  });
  tasksSheet.getRow(5).height = 25;

  // Data rows with formatting
  tasks.forEach((task, index) => {
    const rowNum = 6 + index;
    
    tasksSheet.getCell(rowNum, 1).value = task.title;
    tasksSheet.getCell(rowNum, 1).font = { bold: true };
    
    tasksSheet.getCell(rowNum, 2).value = task.description;
    tasksSheet.getCell(rowNum, 2).alignment = { wrapText: true };
    
    const priorityCell = tasksSheet.getCell(rowNum, 3);
    priorityCell.value = task.priority.toUpperCase();
    priorityCell.alignment = { horizontal: 'center' };
    priorityCell.font = { bold: true };
    
    // Priority color coding
    if (task.priority === 'high') {
      priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
      priorityCell.font = { bold: true, color: { argb: 'FF991B1B' } };
    } else if (task.priority === 'medium') {
      priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      priorityCell.font = { bold: true, color: { argb: 'FF92400E' } };
    } else {
      priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
      priorityCell.font = { bold: true, color: { argb: 'FF3730A3' } };
    }
    
    const deadline = new Date(task.deadline);
    tasksSheet.getCell(rowNum, 4).value = deadline.toLocaleDateString();
    tasksSheet.getCell(rowNum, 4).alignment = { horizontal: 'center' };
    
    const statusCell = tasksSheet.getCell(rowNum, 5);
    statusCell.value = task.isCompleted ? '✓ COMPLETED' : '⏳ PENDING';
    statusCell.alignment = { horizontal: 'center' };
    statusCell.font = { bold: true };
    
    if (task.isCompleted) {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      statusCell.font = { bold: true, color: { argb: 'FF065F46' } };
    } else if (!task.isCompleted && deadline < new Date()) {
      statusCell.value = '⚠ OVERDUE';
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
      statusCell.font = { bold: true, color: { argb: 'FF991B1B' } };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      statusCell.font = { bold: true, color: { argb: 'FF92400E' } };
    }
    
    tasksSheet.getCell(rowNum, 6).value = new Date(task.createdAt).toLocaleDateString();
    tasksSheet.getCell(rowNum, 6).alignment = { horizontal: 'center' };
    
    const daysToDeadline = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    tasksSheet.getCell(rowNum, 7).value = task.isCompleted ? 'Done' : daysToDeadline > 0 ? `${daysToDeadline} days` : `${Math.abs(daysToDeadline)} overdue`;
    tasksSheet.getCell(rowNum, 7).alignment = { horizontal: 'center' };
    
    tasksSheet.getRow(rowNum).height = 25;
  });

  tasksSheet.getColumn(1).width = 25;
  tasksSheet.getColumn(2).width = 40;
  tasksSheet.getColumn(3).width = 15;
  tasksSheet.getColumn(4).width = 15;
  tasksSheet.getColumn(5).width = 18;
  tasksSheet.getColumn(6).width = 15;
  tasksSheet.getColumn(7).width = 15;

  // Credits Sheet with financial analytics
  const creditsSheet = workbook.addWorksheet('Credit Analysis');
  
  // Title
  creditsSheet.mergeCells('A1:G1');
  const creditTitle = creditsSheet.getCell('A1');
  creditTitle.value = 'CREDIT & FINANCIAL ANALYSIS';
  creditTitle.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  creditTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  creditTitle.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF59E0B' }
  };
  creditsSheet.getRow(1).height = 30;

  // Credit Summary
  const creditSummaryData = [
    ['Total Credits:', stats.totalCredits],
    ['Paid:', stats.totalCredits - stats.unpaidCredits],
    ['Unpaid:', stats.unpaidCredits],
    ['Total Amount:', `₹${stats.totalCreditAmount.toLocaleString()}`],
    ['Unpaid Amount:', `₹${stats.unpaidCreditAmount.toLocaleString()}`]
  ];

  creditSummaryData.forEach((item, index) => {
    const col = index * 2 + 1;
    if (col <= 9) {
      creditsSheet.getCell(2, col).value = item[0];
      creditsSheet.getCell(2, col).font = { bold: true, size: 9 };
      creditsSheet.getCell(3, col).value = item[1];
      creditsSheet.getCell(3, col).font = { size: 12, bold: true, color: { argb: 'FFD97706' } };
      creditsSheet.getCell(3, col).alignment = { horizontal: 'center' };
    }
  });

  // Headers
  const creditHeaders = ['Amount', 'Date Taken', 'Return Date', 'Status', 'Overdue Days', 'Impact', 'Note'];
  creditHeaders.forEach((header, index) => {
    const cell = creditsSheet.getCell(5, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF374151' }
    };
  });
  creditsSheet.getRow(5).height = 25;

  // Data rows with financial analysis
  credits.forEach((credit, index) => {
    const rowNum = 6 + index;
    
    const amountCell = creditsSheet.getCell(rowNum, 1);
    amountCell.value = `₹${credit.amount.toLocaleString()}`;
    amountCell.font = { bold: true, size: 11 };
    amountCell.alignment = { horizontal: 'right' };
    
    creditsSheet.getCell(rowNum, 2).value = new Date(credit.dateTaken).toLocaleDateString();
    creditsSheet.getCell(rowNum, 2).alignment = { horizontal: 'center' };
    
    creditsSheet.getCell(rowNum, 3).value = new Date(credit.promiseReturnDate).toLocaleDateString();
    creditsSheet.getCell(rowNum, 3).alignment = { horizontal: 'center' };
    
    const statusCell = creditsSheet.getCell(rowNum, 4);
    statusCell.value = credit.isPaid ? '✓ PAID' : '⚠ UNPAID';
    statusCell.alignment = { horizontal: 'center' };
    statusCell.font = { bold: true };
    
    if (credit.isPaid) {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      statusCell.font = { bold: true, color: { argb: 'FF065F46' } };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
      statusCell.font = { bold: true, color: { argb: 'FF991B1B' } };
    }
    
    const overdueCell = creditsSheet.getCell(rowNum, 5);
    if (!credit.isPaid) {
      const promiseDate = new Date(credit.promiseReturnDate);
      const today = new Date();
      const overdueDays = Math.floor((today.getTime() - promiseDate.getTime()) / (1000 * 60 * 60 * 24));
      overdueCell.value = overdueDays > 0 ? overdueDays : 0;
      overdueCell.alignment = { horizontal: 'center' };
      
      if (overdueDays > 30) {
        overdueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
        overdueCell.font = { bold: true, color: { argb: 'FF991B1B' } };
      } else if (overdueDays > 0) {
        overdueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        overdueCell.font = { bold: true, color: { argb: 'FF92400E' } };
      }
    } else {
      overdueCell.value = '-';
      overdueCell.alignment = { horizontal: 'center' };
    }
    
    const impactCell = creditsSheet.getCell(rowNum, 6);
    const impactPercent = ((credit.amount / stats.baseSalary) * 100).toFixed(1);
    impactCell.value = `${impactPercent}%`;
    impactCell.alignment = { horizontal: 'center' };
    
    const noteCell = creditsSheet.getCell(rowNum, 7);
    if (credit.isPaid) {
      noteCell.value = 'Cleared';
      noteCell.font = { color: { argb: 'FF059669' } };
    } else {
      const promiseDate = new Date(credit.promiseReturnDate);
      const overdueDays = Math.floor((new Date().getTime() - promiseDate.getTime()) / (1000 * 60 * 60 * 24));
      if (overdueDays > 30) {
        noteCell.value = 'Critical - Long Overdue';
        noteCell.font = { color: { argb: 'FF991B1B' } };
      } else if (overdueDays > 0) {
        noteCell.value = 'Action Required';
        noteCell.font = { color: { argb: 'FF92400E' } };
      } else {
        noteCell.value = 'Within Timeline';
        noteCell.font = { color: { argb: 'FF3730A3' } };
      }
    }
    noteCell.alignment = { horizontal: 'center' };
    
    creditsSheet.getRow(rowNum).height = 22;
  });

  creditsSheet.getColumn(1).width = 18;
  creditsSheet.getColumn(2).width = 18;
  creditsSheet.getColumn(3).width = 18;
  creditsSheet.getColumn(4).width = 15;
  creditsSheet.getColumn(5).width = 16;
  creditsSheet.getColumn(6).width = 15;
  creditsSheet.getColumn(7).width = 22;

  // Salary Sheet with detailed breakdown
  const salarySheet = workbook.addWorksheet('Salary Breakdown');
  
  // Title
  salarySheet.mergeCells('A1:D1');
  const salTitle = salarySheet.getCell('A1');
  salTitle.value = 'COMPREHENSIVE SALARY ANALYSIS';
  salTitle.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  salTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  salTitle.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  };
  salarySheet.getRow(1).height = 30;

  // Earnings Section
  salarySheet.mergeCells('A3:D3');
  const earningsHeader = salarySheet.getCell('A3');
  earningsHeader.value = '💰 EARNINGS';
  earningsHeader.font = { size: 14, bold: true, color: { argb: 'FF1F2937' } };
  earningsHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDBEAFE' }
  };
  earningsHeader.alignment = { horizontal: 'left', vertical: 'middle' };
  salarySheet.getRow(3).height = 25;

  const earningsData = [
    ['Base Salary', `₹${stats.baseSalary.toLocaleString()}`, '100%', 'FFD1FAE5']
  ];

  earningsData.forEach((row, index) => {
    const rowNum = 4 + index;
    salarySheet.getCell(rowNum, 1).value = row[0];
    salarySheet.getCell(rowNum, 1).font = { bold: true, size: 11 };
    
    salarySheet.getCell(rowNum, 2).value = row[1];
    salarySheet.getCell(rowNum, 2).font = { bold: true, size: 12 };
    salarySheet.getCell(rowNum, 2).alignment = { horizontal: 'right' };
    salarySheet.getCell(rowNum, 2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: row[3] }
    };
    
    salarySheet.getCell(rowNum, 3).value = row[2];
    salarySheet.getCell(rowNum, 3).alignment = { horizontal: 'center' };
    salarySheet.getCell(rowNum, 3).font = { bold: true, color: { argb: 'FF059669' } };
    
    salarySheet.getRow(rowNum).height = 22;
  });

  // Deductions Section
  const deductionsRow = 4 + earningsData.length + 1;
  salarySheet.mergeCells(`A${deductionsRow}:D${deductionsRow}`);
  const deductionsHeader = salarySheet.getCell(`A${deductionsRow}`);
  deductionsHeader.value = '⚠️ DEDUCTIONS';
  deductionsHeader.font = { size: 14, bold: true, color: { argb: 'FF1F2937' } };
  deductionsHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFED7D7' }
  };
  deductionsHeader.alignment = { horizontal: 'left', vertical: 'middle' };
  salarySheet.getRow(deductionsRow).height = 25;

  const creditDeductionPercent = stats.baseSalary > 0 ? ((stats.creditDeduction / stats.baseSalary) * 100).toFixed(1) : '0';
  const leaveDeductionPercent = stats.baseSalary > 0 ? ((stats.leaveDeduction / stats.baseSalary) * 100).toFixed(1) : '0';
  const totalDeductions = stats.creditDeduction + stats.leaveDeduction;
  const totalDeductionPercent = stats.baseSalary > 0 ? ((totalDeductions / stats.baseSalary) * 100).toFixed(1) : '0';

  const deductionsData = [
    ['Unpaid Credits', `₹${stats.creditDeduction.toLocaleString()}`, `${creditDeductionPercent}%`, 'FFFECACA'],
    ['Leave Deductions', `₹${stats.leaveDeduction.toLocaleString()}`, `${leaveDeductionPercent}%`, 'FFFECACA'],
    ['Total Deductions', `₹${totalDeductions.toLocaleString()}`, `${totalDeductionPercent}%`, 'FFFED7D7']
  ];

  deductionsData.forEach((row, index) => {
    const rowNum = deductionsRow + 1 + index;
    salarySheet.getCell(rowNum, 1).value = row[0];
    salarySheet.getCell(rowNum, 1).font = { bold: true, size: 11 };
    
    salarySheet.getCell(rowNum, 2).value = row[1];
    salarySheet.getCell(rowNum, 2).font = { bold: index === 2, size: index === 2 ? 12 : 11, color: { argb: 'FF991B1B' } };
    salarySheet.getCell(rowNum, 2).alignment = { horizontal: 'right' };
    salarySheet.getCell(rowNum, 2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: row[3] }
    };
    
    salarySheet.getCell(rowNum, 3).value = row[2];
    salarySheet.getCell(rowNum, 3).alignment = { horizontal: 'center' };
    salarySheet.getCell(rowNum, 3).font = { bold: true, color: { argb: 'FF991B1B' } };
    
    salarySheet.getRow(rowNum).height = 22;
  });

  // Net Salary Section
  const netSalaryRow = deductionsRow + deductionsData.length + 2;
  salarySheet.mergeCells(`A${netSalaryRow}:D${netSalaryRow}`);
  const netHeader = salarySheet.getCell(`A${netSalaryRow}`);
  netHeader.value = '💵 NET SALARY (TAKE HOME)';
  netHeader.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  netHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }
  };
  netHeader.alignment = { horizontal: 'left', vertical: 'middle' };
  salarySheet.getRow(netSalaryRow).height = 30;

  const netSalaryPercent = stats.baseSalary > 0 ? ((stats.netSalary / stats.baseSalary) * 100).toFixed(1) : '0';
  
  salarySheet.getCell(netSalaryRow + 1, 1).value = 'Final Amount';
  salarySheet.getCell(netSalaryRow + 1, 1).font = { bold: true, size: 13 };
  
  salarySheet.getCell(netSalaryRow + 1, 2).value = `₹${stats.netSalary.toLocaleString()}`;
  salarySheet.getCell(netSalaryRow + 1, 2).font = { bold: true, size: 16, color: { argb: 'FF1E40AF' } };
  salarySheet.getCell(netSalaryRow + 1, 2).alignment = { horizontal: 'right' };
  salarySheet.getCell(netSalaryRow + 1, 2).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFBFDBFE' }
  };
  
  salarySheet.getCell(netSalaryRow + 1, 3).value = `${netSalaryPercent}%`;
  salarySheet.getCell(netSalaryRow + 1, 3).alignment = { horizontal: 'center' };
  salarySheet.getCell(netSalaryRow + 1, 3).font = { bold: true, size: 13, color: { argb: 'FF1E40AF' } };
  
  salarySheet.getRow(netSalaryRow + 1).height = 28;

  // Summary Notes
  const notesRow = netSalaryRow + 3;
  salarySheet.mergeCells(`A${notesRow}:D${notesRow}`);
  const notesCell = salarySheet.getCell(`A${notesRow}`);
  notesCell.value = '📊 Financial Summary & Recommendations';
  notesCell.font = { size: 12, bold: true, color: { argb: 'FF374151' } };
  notesCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' }
  };

  const recommendations = [];
  if (stats.unpaidCredits > 0) {
    recommendations.push(`⚠️ ${stats.unpaidCredits} unpaid credit(s) totaling ₹${stats.unpaidCreditAmount.toLocaleString()}`);
  }
  if (stats.absentDays > 5) {
    recommendations.push(`⚠️ High absence rate: ${stats.absentDays} days absent`);
  }
  if (parseFloat(stats.attendancePercentage) < 80) {
    recommendations.push(`⚠️ Attendance below 80%: Consider improvement plan`);
  }
  if (stats.overdueTasks > 0) {
    recommendations.push(`⚠️ ${stats.overdueTasks} overdue task(s) requiring attention`);
  }
  if (recommendations.length === 0) {
    recommendations.push('✓ Excellent performance with no critical issues');
  }

  recommendations.forEach((rec, index) => {
    salarySheet.mergeCells(`A${notesRow + 1 + index}:D${notesRow + 1 + index}`);
    const recCell = salarySheet.getCell(`A${notesRow + 1 + index}`);
    recCell.value = rec;
    recCell.font = { size: 10, color: rec.includes('✓') ? { argb: 'FF059669' } : { argb: 'FF92400E' } };
    recCell.alignment = { horizontal: 'left' };
  });

  salarySheet.getColumn(1).width = 30;
  salarySheet.getColumn(2).width = 25;
  salarySheet.getColumn(3).width = 15;
  salarySheet.getColumn(4).width = 15;

  try {
    const fileName = `${employee.name.replace(/\s+/g, '_')}_Report_${new Date().getTime()}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
}

export async function exportMultipleEmployees(employeeData: EmployeeExportData[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Karigar Employee Management';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('All Employees');
  
  summarySheet.getCell('A1').value = 'EMPLOYEE SUMMARY REPORT';
  summarySheet.mergeCells('A1:H1');
  summarySheet.getCell('A1').font = { size: 18, bold: true };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };

  const headers = ['Name', 'Role', 'Email', 'Mobile', 'Joining Date', 'Base Salary', 'Deductions', 'Net Salary'];
  headers.forEach((header, index) => {
    const cell = summarySheet.getCell(3, index + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center' };
  });

  employeeData.forEach((data, index) => {
    const { employee, stats } = data;
    const rowNum = 4 + index;
    
    summarySheet.getCell(rowNum, 1).value = employee.name;
    summarySheet.getCell(rowNum, 2).value = employee.role;
    summarySheet.getCell(rowNum, 3).value = employee.email || 'N/A';
    summarySheet.getCell(rowNum, 4).value = employee.mobile || 'N/A';
    summarySheet.getCell(rowNum, 5).value = new Date(employee.joiningDate).toLocaleDateString();
    summarySheet.getCell(rowNum, 6).value = `₹${stats.baseSalary.toLocaleString()}`;
    summarySheet.getCell(rowNum, 7).value = `₹${(stats.creditDeduction + stats.leaveDeduction).toLocaleString()}`;
    summarySheet.getCell(rowNum, 8).value = `₹${stats.netSalary.toLocaleString()}`;
  });

  summarySheet.getColumn(1).width = 25;
  summarySheet.getColumn(2).width = 18;
  summarySheet.getColumn(3).width = 30;
  summarySheet.getColumn(4).width = 18;
  summarySheet.getColumn(5).width = 18;
  summarySheet.getColumn(6).width = 18;
  summarySheet.getColumn(7).width = 18;
  summarySheet.getColumn(8).width = 18;

  for (const data of employeeData) {
    const { employee, stats } = data;
    const sheetName = employee.name.substring(0, 30);

    const empSheet = workbook.addWorksheet(sheetName);
    
    empSheet.getCell('A1').value = employee.name.toUpperCase();
    empSheet.mergeCells('A1:D1');
    empSheet.getCell('A1').font = { size: 16, bold: true };
    empSheet.getCell('A1').alignment = { horizontal: 'center' };

    const details = [
      ['Role:', employee.role],
      ['Email:', employee.email || 'N/A'],
      ['Mobile:', employee.mobile || 'N/A'],
      ['Attendance:', `${stats.attendancePercentage}%`],
      ['Tasks:', `${stats.completedTasks}/${stats.totalTasks}`],
      ['Credits:', `₹${stats.unpaidCreditAmount.toLocaleString()} unpaid`],
      ['Net Salary:', `₹${stats.netSalary.toLocaleString()}`]
    ];

    details.forEach((row, index) => {
      const rowNum = 3 + index;
      empSheet.getCell(rowNum, 1).value = row[0];
      empSheet.getCell(rowNum, 2).value = row[1];
      empSheet.getCell(rowNum, 1).font = { bold: true };
    });

    empSheet.getColumn(1).width = 20;
    empSheet.getColumn(2).width = 30;
  }

  try {
    const fileName = `Multiple_Employees_Report_${new Date().getTime()}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting multiple employees to Excel:', error);
    throw error;
  }
}
