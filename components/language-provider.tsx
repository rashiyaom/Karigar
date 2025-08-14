"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "gu"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation dictionary
const translations = {
  en: {
    // Dashboard
    "dashboard.title": "Employee Management System",
    "dashboard.totalEmployees": "Total Employees",
    "dashboard.attendanceToday": "Attendance Today",
    "dashboard.pendingTasks": "Pending Tasks",
    "dashboard.outstandingCredits": "Outstanding Credits",
    "dashboard.quickActions": "Quick Actions",
    "dashboard.addEmployee": "Add Employee",
    "dashboard.markAttendance": "Mark Attendance",
    "dashboard.addCredit": "Add Credit",
    "dashboard.assignTask": "Assign Task",
    "dashboard.employeeList": "Employee List",
    "dashboard.search": "Search employees...",

    // Employee
    "employee.name": "Name",
    "employee.salary": "Salary (₹)",
    "employee.joiningDate": "Joining Date",
    "employee.mobile": "Mobile",
    "employee.email": "Email",
    "employee.role": "Role",
    "employee.status": "Status",
    "employee.active": "Active",
    "employee.inactive": "Inactive",
    "employee.edit": "Edit",
    "employee.delete": "Delete",
    "employee.add": "Add Employee",
    "employee.update": "Update Employee",

    // Attendance
    "attendance.present": "Present",
    "attendance.absent": "Absent",
    "attendance.halfDay": "Half Day",
    "attendance.sickLeave": "Sick Leave",
    "attendance.paidLeave": "Paid Leave",
    "attendance.calendar": "Attendance Calendar",

    // Credits
    "credits.amount": "Amount (₹)",
    "credits.dateTaken": "Date Taken",
    "credits.promiseReturnDate": "Promise Return Date",
    "credits.add": "Add Credit",
    "credits.management": "Credit Management",

    // Tasks
    "tasks.title": "Title",
    "tasks.description": "Description",
    "tasks.deadline": "Deadline",
    "tasks.priority": "Priority",
    "tasks.high": "High",
    "tasks.medium": "Medium",
    "tasks.low": "Low",
    "tasks.completed": "Completed",
    "tasks.pending": "Pending",
    "tasks.add": "Add Task",
    "tasks.management": "Task Management",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.close": "Close",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.settings": "Settings",
    "common.organization": "Organization",
    "common.theme": "Theme",
    "common.language": "Language",
    "common.currency": "Currency (₹)",
    "common.rupees": "Rupees",
  },
  gu: {
    // Dashboard
    "dashboard.title": "કર્મચારી વ્યવસ્થાપન સિસ્ટમ",
    "dashboard.totalEmployees": "કુલ કર્મચારીઓ",
    "dashboard.attendanceToday": "આજની હાજરી",
    "dashboard.pendingTasks": "બાકી કાર્યો",
    "dashboard.outstandingCredits": "બાકી ક્રેડિટ્સ",
    "dashboard.quickActions": "ઝડપી ક્રિયાઓ",
    "dashboard.addEmployee": "કર્મચારી ઉમેરો",
    "dashboard.markAttendance": "હાજરી નોંધો",
    "dashboard.addCredit": "ક્રેડિટ ઉમેરો",
    "dashboard.assignTask": "કાર્ય સોંપો",
    "dashboard.employeeList": "કર્મચારીઓની યાદી",
    "dashboard.search": "કર્મચારીઓ શોધો...",

    // Employee
    "employee.name": "નામ",
    "employee.salary": "પગાર (₹)",
    "employee.joiningDate": "જોડાવાની તારીખ",
    "employee.mobile": "મોબાઇલ",
    "employee.email": "ઇમેઇલ",
    "employee.role": "પદ",
    "employee.status": "સ્થિતિ",
    "employee.active": "સક્રિય",
    "employee.inactive": "નિષ્ક્રિય",
    "employee.edit": "સંપાદન",
    "employee.delete": "કાઢી નાખો",
    "employee.add": "કર્મચારી ઉમેરો",
    "employee.update": "કર્મચારી અપડેટ કરો",

    // Attendance
    "attendance.present": "હાજર",
    "attendance.absent": "ગેરહાજર",
    "attendance.halfDay": "અર્ધ દિવસ",
    "attendance.sickLeave": "બીમારીની રજા",
    "attendance.paidLeave": "પેઇડ રજા",
    "attendance.calendar": "હાજરી કેલેન્ડર",

    // Credits
    "credits.amount": "રકમ (₹)",
    "credits.dateTaken": "લીધેલી તારીખ",
    "credits.promiseReturnDate": "પરત કરવાની વચન તારીખ",
    "credits.add": "ક્રેડિટ ઉમેરો",
    "credits.management": "ક્રેડિટ વ્યવસ્થાપન",

    // Tasks
    "tasks.title": "શીર્ષક",
    "tasks.description": "વર્ણન",
    "tasks.deadline": "અંતિમ તારીખ",
    "tasks.priority": "પ્રાથમિકતા",
    "tasks.high": "ઉચ્ચ",
    "tasks.medium": "મધ્યમ",
    "tasks.low": "નીચું",
    "tasks.completed": "પૂર્ણ",
    "tasks.pending": "બાકી",
    "tasks.add": "કાર્ય ઉમેરો",
    "tasks.management": "કાર્ય વ્યવસ્થાપન",

    // Common
    "common.save": "સાચવો",
    "common.cancel": "રદ કરો",
    "common.delete": "કાઢી નાખો",
    "common.edit": "સંપાદન",
    "common.view": "જુઓ",
    "common.close": "બંધ કરો",
    "common.loading": "લોડ થઈ રહ્યું છે...",
    "common.error": "ભૂલ",
    "common.success": "સફળતા",
    "common.settings": "સેટિંગ્સ",
    "common.organization": "સંસ્થા",
    "common.theme": "થીમ",
    "common.language": "ભાષા",
    "common.currency": "ચલણ (₹)",
    "common.rupees": "રૂપિયા",
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "gu")) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)["en"]] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
