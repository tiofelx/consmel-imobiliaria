'use client';

import { useState, useEffect } from 'react';
import './agenda.css';
import { isHoliday, getHolidays } from '@/lib/holidays';

export default function AgendaPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '09:00',
        type: 'visit',
        description: ''
    });

    // Tooltip State
    const [hoveredEvents, setHoveredEvents] = useState([]);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [hoveredDate, setHoveredDate] = useState(null);

    // Load events from database
    useEffect(() => {
        fetch('/api/events', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setEvents(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Tooltip Handlers
    const handleMouseEnter = (dayEvents, dateString, e) => {
        if (dayEvents.length > 0) {
            setHoveredEvents(dayEvents);
            setHoveredDate(dateString);
            setTooltipPos({ x: e.clientX + 15, y: e.clientY + 15 });
        } else {
            setHoveredEvents([]);
            setHoveredDate(null);
        }
    };

    const handleMouseMove = (e) => {
        if (hoveredEvents.length > 0) {
            const x = e.clientX + 15;
            const y = e.clientY + 15;
            setTooltipPos({ x, y });
        }
    };

    const handleMouseLeave = () => {
        setHoveredEvents([]);
        setHoveredDate(null);
    };

    // Calendar Logic
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = 0; i < startingDay; i++) {
            days.push({
                day: prevMonthLastDay - startingDay + 1 + i,
                currentMonth: false,
                dateString: new Date(year, month - 1, prevMonthLastDay - startingDay + 1 + i).toISOString().split('T')[0]
            });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            // Check for holiday
            const holidayInfo = isHoliday(dateString);

            days.push({
                day: i,
                currentMonth: true,
                isToday: new Date().toDateString() === d.toDateString(),
                dateString: dateString,
                isHoliday: !!holidayInfo,
                holidayName: holidayInfo ? holidayInfo.name : null
            });
        }

        const currentDaysCount = days.length;
        const remainingCells = (7 - (currentDaysCount % 7)) % 7;

        for (let i = 1; i <= remainingCells; i++) {
            const nextMonthDate = new Date(year, month + 1, i);
            const dateString = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-${String(nextMonthDate.getDate()).padStart(2, '0')}`;

            days.push({
                day: i,
                currentMonth: false,
                dateString: dateString
            });
        }

        return days;
    };

    const days = getDaysInMonth(currentDate);
    const weeksCount = Math.ceil(days.length / 7);

    // Get holidays for current month for legend
    const currentMonthHolidays = getHolidays(currentDate.getFullYear()).filter(h => {
        const hDate = new Date(h.date + 'T12:00:00'); // Fix TZ issues
        return hDate.getMonth() === currentDate.getMonth();
    });

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const formatMonth = (date) => {
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    };

    const getEventsForDate = (dateString) => {
        return events.filter(e => e.date === dateString);
    };

    const handleDayClick = (dateString) => {
        setEditingEvent(null);
        setFormData({
            title: '',
            date: dateString,
            time: '09:00',
            type: 'visit',
            description: ''
        });
        setIsModalOpen(true);
    };

    const handleEventClick = (e, event) => {
        e.stopPropagation();
        setEditingEvent(event);
        setFormData({ ...event });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            if (editingEvent) {
                // Update existing event
                const res = await fetch(`/api/events/${editingEvent.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
                if (res.ok) {
                    const updated = await res.json();
                    setEvents(prev => prev.map(ev => ev.id === updated.id ? updated : ev));
                }
            } else {
                // Create new event
                const res = await fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
                if (res.ok) {
                    const created = await res.json();
                    setEvents(prev => [...prev, created]);
                }
            }
        } catch (error) {
            console.error('Error saving event:', error);
        }

        setIsModalOpen(false);
    };

    const handleDelete = async () => {
        if (!editingEvent) return;
        if (confirm('Tem certeza que deseja excluir este evento?')) {
            try {
                const res = await fetch(`/api/events/${editingEvent.id}`, { method: 'DELETE' });
                if (res.ok) {
                    setEvents(prev => prev.filter(ev => ev.id !== editingEvent.id));
                }
            } catch (error) {
                console.error('Error deleting event:', error);
            }
            setIsModalOpen(false);
        }
    };

    return (
        <div className="agenda-wrapper">
            {/* Tooltip Component */}
            {hoveredEvents.length > 0 && (
                <div
                    className="event-tooltip"
                    style={{ left: tooltipPos.x, top: tooltipPos.y }}
                >
                    <div className="tooltip-header">
                        {new Date(hoveredDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div className="tooltip-event-list">
                        {hoveredEvents.map(event => (
                            <div key={event.id} className="tooltip-event-item">
                                <div className="tooltip-event-title">
                                    <span className={`tooltip-dot dot-${event.type}`}></span>
                                    {event.title}
                                </div>
                                <div className="tooltip-event-time">
                                    {event.time}
                                </div>
                                {event.description && (
                                    <div className="tooltip-event-desc">{event.description}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="admin-section-header">
                <div className="admin-header-content">
                    <h2>Agenda</h2>
                    <p>Organize suas visitas e compromissos.</p>
                </div>
                <div>
                    <button
                        className="btn-header-action"
                        onClick={() => handleDayClick(new Date().toISOString().split('T')[0])}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Novo Evento
                    </button>
                </div>
            </div>

            <div className="agenda-header-controls">
                <div className="month-nav">
                    <button onClick={prevMonth} className="nav-btn-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <div className="month-title" style={{ textTransform: 'capitalize' }}>
                        {formatMonth(currentDate)}
                    </div>
                    <button onClick={nextMonth} className="nav-btn-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
            </div>

            <div className="calendar-grid" style={{ '--weeks': weeksCount }}>
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="calendar-day-header">{day}</div>
                ))}

                <div className="calendar-grid-content" style={{ display: 'contents' }}>
                    {days.map((dayObj, index) => {
                        const dayEvents = getEventsForDate(dayObj.dateString);
                        return (
                            <div
                                key={index}
                                className={`calendar-cell 
                                    ${dayObj.currentMonth ? '' : 'other-month'} 
                                    ${dayObj.isToday ? 'today' : ''}
                                    ${dayObj.isHoliday ? 'holiday' : ''}
                                `}
                                onClick={() => handleDayClick(dayObj.dateString)}
                                onMouseEnter={(e) => handleMouseEnter(dayEvents, dayObj.dateString, e)}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                title={dayObj.holidayName ? `Feriado: ${dayObj.holidayName}` : ''}
                            >
                                <span className="day-number">{dayObj.day}</span>
                                {dayObj.isHoliday && (
                                    <span className="holiday-label">{dayObj.holidayName}</span>
                                )}
                                {dayEvents.map(event => (
                                    <div
                                        key={event.id}
                                        className={`event-tag event-${event.type}`}
                                        onClick={(e) => handleEventClick(e, event)}
                                        title={event.title}
                                    >
                                        <span className="event-time">{event.time}</span>
                                        {event.title}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Holiday Legend */}
            {currentMonthHolidays.length > 0 && (
                <div className="holiday-legend">
                    <h4>Feriados deste mês:</h4>
                    <div className="holiday-list">
                        {currentMonthHolidays.map((h, i) => (
                            <span key={i} className="holiday-item">
                                <span className="holiday-dot"></span>
                                <strong>{new Date(h.date + 'T12:00:00').getDate()}:</strong> {h.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Event Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            <div className="modal-input-group">
                                <label>Título</label>
                                <input
                                    type="text"
                                    className="modal-input"
                                    required
                                    placeholder="Ex: Visita Casa Jardins"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="modal-row">
                                <div className="modal-input-group">
                                    <label>Data</label>
                                    <input
                                        type="date"
                                        className="modal-input"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="modal-input-group">
                                    <label>Horário</label>
                                    <input
                                        type="time"
                                        className="modal-input"
                                        required
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="modal-input-group">
                                <label>Tipo</label>
                                <select
                                    className="modal-select"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="visit">Visita</option>
                                    <option value="meeting">Reunião</option>
                                    <option value="call">Ligação</option>
                                </select>
                            </div>

                            <div className="modal-input-group">
                                <label>Descrição</label>
                                <textarea
                                    className="modal-textarea"
                                    placeholder="Detalhes adicionais..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                {editingEvent && (
                                    <button type="button" className="btn-delete" onClick={handleDelete}>
                                        Excluir
                                    </button>
                                )}
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-save">
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
