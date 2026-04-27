'use client';

import { useState, useEffect, useMemo } from 'react';
import './agenda.css';
import { isHoliday, getHolidays } from '@/lib/holidays';

const TYPE_META = {
    visit: { label: 'Visitas', dotClass: 'dot-visit' },
    meeting: { label: 'Reuniões', dotClass: 'dot-meeting' },
    call: { label: 'Ligações', dotClass: 'dot-call' },
};

const WEEKDAYS_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAYS_MINI = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function toDateString(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfWeek(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
}

function getMonthGrid(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const today = new Date();
    const days = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < startingDay; i++) {
        const d = new Date(year, month - 1, prevMonthLastDay - startingDay + 1 + i);
        days.push(buildDay(d, false, today));
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const d = new Date(year, month, i);
        days.push(buildDay(d, true, today));
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push(buildDay(d, false, today));
    }
    return days;
}

function buildDay(d, currentMonth, today) {
    const dateString = toDateString(d);
    const holidayInfo = isHoliday(dateString);
    return {
        day: d.getDate(),
        date: d,
        currentMonth,
        isToday: isSameDay(d, today),
        dateString,
        isHoliday: !!holidayInfo,
        holidayName: holidayInfo ? holidayInfo.name : null,
    };
}

function getWeekDays(date) {
    const start = startOfWeek(date);
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return buildDay(d, true, today);
    });
}

export default function AgendaPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('month');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [typeFilters, setTypeFilters] = useState({ visit: true, meeting: true, call: true });
    const [showHolidays, setShowHolidays] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({
        title: '', date: '', time: '09:00', type: 'visit', description: ''
    });

    const [hoveredEvents, setHoveredEvents] = useState([]);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [hoveredDate, setHoveredDate] = useState(null);

    useEffect(() => {
        fetch('/api/events', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => { setEvents(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const filteredEvents = useMemo(
        () => events.filter(e => typeFilters[e.type] !== false),
        [events, typeFilters]
    );

    const eventsByDate = useMemo(() => {
        const map = {};
        for (const e of filteredEvents) {
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e);
        }
        for (const k of Object.keys(map)) {
            map[k].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        }
        return map;
    }, [filteredEvents]);

    const getEventsForDate = (dateString) => eventsByDate[dateString] || [];

    const handleMouseEnter = (dayEvents, dateString, e) => {
        if (dayEvents.length > 0) {
            setHoveredEvents(dayEvents);
            setHoveredDate(dateString);
            setTooltipPos({ x: e.clientX + 15, y: e.clientY + 15 });
        }
    };
    const handleMouseMove = (e) => {
        if (hoveredEvents.length > 0) setTooltipPos({ x: e.clientX + 15, y: e.clientY + 15 });
    };
    const handleMouseLeave = () => {
        setHoveredEvents([]);
        setHoveredDate(null);
    };

    const navigate = (delta) => {
        const d = new Date(currentDate);
        if (view === 'month' || view === 'list') d.setMonth(d.getMonth() + delta);
        else if (view === 'week') d.setDate(d.getDate() + 7 * delta);
        else if (view === 'day') d.setDate(d.getDate() + delta);
        setCurrentDate(d);
    };
    const goToToday = () => setCurrentDate(new Date());

    const handleDayClick = (dateString) => {
        setEditingEvent(null);
        setFormData({ title: '', date: dateString, time: '09:00', type: 'visit', description: '' });
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
                if (res.ok) setEvents(prev => prev.filter(ev => ev.id !== editingEvent.id));
            } catch (error) {
                console.error('Error deleting event:', error);
            }
            setIsModalOpen(false);
        }
    };

    const headerTitle = useMemo(() => {
        const fmt = (d, opts) => d.toLocaleDateString('pt-BR', opts);
        if (view === 'month' || view === 'list') {
            return fmt(currentDate, { month: 'long', year: 'numeric' });
        }
        if (view === 'week') {
            const start = startOfWeek(currentDate);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            const sameMonth = start.getMonth() === end.getMonth();
            if (sameMonth) {
                return `${start.getDate()} – ${end.getDate()} de ${fmt(start, { month: 'long', year: 'numeric' })}`;
            }
            return `${fmt(start, { day: 'numeric', month: 'short' })} – ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
        return fmt(currentDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }, [view, currentDate]);

    return (
        <div className={`agenda-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
            {hoveredEvents.length > 0 && (
                <div className="event-tooltip" style={{ left: tooltipPos.x, top: tooltipPos.y }}>
                    <div className="tooltip-header">
                        {new Date(hoveredDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div className="tooltip-event-list">
                        {hoveredEvents.map(event => (
                            <div key={event.id} className="tooltip-event-item">
                                <div className="tooltip-event-title">
                                    <span className={`tooltip-dot dot-${event.type}`}></span>
                                    {event.title}
                                </div>
                                <div className="tooltip-event-time">{event.time}</div>
                                {event.description && <div className="tooltip-event-desc">{event.description}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {sidebarOpen && <div className="agenda-backdrop" onClick={() => setSidebarOpen(false)} />}

            <Sidebar
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                onCreate={() => handleDayClick(toDateString(new Date()))}
                typeFilters={typeFilters}
                setTypeFilters={setTypeFilters}
                showHolidays={showHolidays}
                setShowHolidays={setShowHolidays}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="agenda-main">
                <div className="admin-section-header agenda-section-header">
                    <div className="admin-header-content">
                        <h2>Agenda</h2>
                        <p>Organize suas visitas e compromissos.</p>
                    </div>
                </div>

                <div className="agenda-toolbar">
                    <button
                        className="agenda-menu-btn"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Abrir menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                    </button>

                    <button className="btn-today" onClick={goToToday}>Hoje</button>

                    <div className="month-nav">
                        <button onClick={() => navigate(-1)} className="nav-btn-icon" aria-label="Anterior">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                        <button onClick={() => navigate(1)} className="nav-btn-icon" aria-label="Próximo">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    </div>

                    <div className="agenda-title">{headerTitle}</div>

                    <div className="view-switcher" role="tablist">
                        {[
                            { v: 'month', label: 'Mês' },
                            { v: 'week', label: 'Semana' },
                            { v: 'day', label: 'Dia' },
                            { v: 'list', label: 'Lista' },
                        ].map(({ v, label }) => (
                            <button
                                key={v}
                                role="tab"
                                aria-selected={view === v}
                                className={`view-tab ${view === v ? 'active' : ''}`}
                                onClick={() => setView(v)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="agenda-content">
                    {loading ? (
                        <div className="agenda-loading">Carregando…</div>
                    ) : view === 'month' ? (
                        <MonthView
                            currentDate={currentDate}
                            getEventsForDate={getEventsForDate}
                            showHolidays={showHolidays}
                            onDayClick={handleDayClick}
                            onEventClick={handleEventClick}
                            onMouseEnter={handleMouseEnter}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        />
                    ) : view === 'week' ? (
                        <WeekView
                            currentDate={currentDate}
                            getEventsForDate={getEventsForDate}
                            showHolidays={showHolidays}
                            onDayClick={handleDayClick}
                            onEventClick={handleEventClick}
                        />
                    ) : view === 'day' ? (
                        <DayView
                            currentDate={currentDate}
                            getEventsForDate={getEventsForDate}
                            onDayClick={handleDayClick}
                            onEventClick={handleEventClick}
                        />
                    ) : (
                        <ListView
                            currentDate={currentDate}
                            events={filteredEvents}
                            showHolidays={showHolidays}
                            onEventClick={handleEventClick}
                            onDayClick={handleDayClick}
                        />
                    )}
                </div>
            </main>

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
                                <input type="text" className="modal-input" required placeholder="Ex: Visita Casa Jardins" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="modal-row">
                                <div className="modal-input-group">
                                    <label>Data</label>
                                    <input type="date" className="modal-input" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div className="modal-input-group">
                                    <label>Horário</label>
                                    <input type="time" className="modal-input" required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-input-group">
                                <label>Tipo</label>
                                <select className="modal-select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="visit">Visita</option>
                                    <option value="meeting">Reunião</option>
                                    <option value="call">Ligação</option>
                                </select>
                            </div>
                            <div className="modal-input-group">
                                <label>Descrição</label>
                                <textarea className="modal-textarea" placeholder="Detalhes adicionais..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                {editingEvent && <button type="button" className="btn-delete" onClick={handleDelete}>Excluir</button>}
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-save">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function Sidebar({ currentDate, setCurrentDate, onCreate, typeFilters, setTypeFilters, showHolidays, setShowHolidays, onClose }) {
    return (
        <aside className="agenda-sidebar">
            <div className="sidebar-top">
                <button className="sidebar-close" onClick={onClose} aria-label="Fechar menu">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
                <button className="sidebar-create" onClick={onCreate}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Novo Evento
                </button>
            </div>

            <MiniCalendar value={currentDate} onChange={setCurrentDate} />

            <div className="sidebar-section">
                <div className="sidebar-section-title">Tipos de evento</div>
                {Object.entries(TYPE_META).map(([key, meta]) => (
                    <label key={key} className="filter-row">
                        <input
                            type="checkbox"
                            checked={typeFilters[key] !== false}
                            onChange={e => setTypeFilters({ ...typeFilters, [key]: e.target.checked })}
                        />
                        <span className={`filter-dot ${meta.dotClass}`} />
                        <span className="filter-label">{meta.label}</span>
                    </label>
                ))}
            </div>

            <div className="sidebar-section">
                <div className="sidebar-section-title">Outros</div>
                <label className="filter-row">
                    <input
                        type="checkbox"
                        checked={showHolidays}
                        onChange={e => setShowHolidays(e.target.checked)}
                    />
                    <span className="filter-dot dot-holiday" />
                    <span className="filter-label">Feriados</span>
                </label>
            </div>
        </aside>
    );
}

function MiniCalendar({ value, onChange }) {
    const valueKey = `${value.getFullYear()}-${value.getMonth()}`;
    const [lastValueKey, setLastValueKey] = useState(valueKey);
    const [viewDate, setViewDate] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));

    if (valueKey !== lastValueKey) {
        setLastValueKey(valueKey);
        setViewDate(new Date(value.getFullYear(), value.getMonth(), 1));
    }

    const days = getMonthGrid(viewDate);
    const monthLabel = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="mini-calendar">
            <div className="mini-cal-header">
                <span className="mini-cal-title">{monthLabel}</span>
                <div className="mini-cal-nav">
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} aria-label="Anterior">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} aria-label="Próximo">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
            </div>
            <div className="mini-cal-weekdays">
                {WEEKDAYS_MINI.map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="mini-cal-grid">
                {days.map((d, i) => (
                    <button
                        key={i}
                        className={`mini-cal-day ${!d.currentMonth ? 'muted' : ''} ${d.isToday ? 'today' : ''} ${isSameDay(d.date, value) ? 'selected' : ''}`}
                        onClick={() => onChange(d.date)}
                    >
                        {d.day}
                    </button>
                ))}
            </div>
        </div>
    );
}

function MonthView({ currentDate, getEventsForDate, showHolidays, onDayClick, onEventClick, onMouseEnter, onMouseMove, onMouseLeave }) {
    const days = getMonthGrid(currentDate);
    const weeksCount = Math.ceil(days.length / 7);
    const monthHolidays = useMemo(() => {
        return getHolidays(currentDate.getFullYear()).filter(h => {
            const hDate = new Date(h.date + 'T12:00:00');
            return hDate.getMonth() === currentDate.getMonth();
        });
    }, [currentDate]);

    return (
        <>
            <div className="calendar-grid" style={{ '--weeks': weeksCount }}>
                {WEEKDAYS_SHORT.map(day => (
                    <div key={day} className="calendar-day-header">{day}</div>
                ))}
                <div className="calendar-grid-content" style={{ display: 'contents' }}>
                    {days.map((dayObj, index) => {
                        const dayEvents = getEventsForDate(dayObj.dateString);
                        const showHol = showHolidays && dayObj.isHoliday;
                        return (
                            <div
                                key={index}
                                className={`calendar-cell ${dayObj.currentMonth ? '' : 'other-month'} ${dayObj.isToday ? 'today' : ''} ${showHol ? 'holiday' : ''}`}
                                onClick={() => onDayClick(dayObj.dateString)}
                                onMouseEnter={(e) => onMouseEnter(dayEvents, dayObj.dateString, e)}
                                onMouseMove={onMouseMove}
                                onMouseLeave={onMouseLeave}
                            >
                                <span className="day-number">{dayObj.day}</span>
                                {showHol && <span className="holiday-label">{dayObj.holidayName}</span>}
                                {dayEvents.map(event => (
                                    <div
                                        key={event.id}
                                        className={`event-tag event-${event.type}`}
                                        onClick={(e) => onEventClick(e, event)}
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

            {showHolidays && monthHolidays.length > 0 && (
                <div className="holiday-legend">
                    <h4>Feriados deste mês:</h4>
                    <div className="holiday-list">
                        {monthHolidays.map((h, i) => (
                            <span key={i} className="holiday-item">
                                <span className="holiday-dot"></span>
                                <strong>{new Date(h.date + 'T12:00:00').getDate()}:</strong> {h.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

function WeekView({ currentDate, getEventsForDate, showHolidays, onDayClick, onEventClick }) {
    const days = getWeekDays(currentDate);
    return (
        <div className="week-view">
            {days.map((d, i) => {
                const dayEvents = getEventsForDate(d.dateString);
                const showHol = showHolidays && d.isHoliday;
                return (
                    <div
                        key={i}
                        className={`week-day-card ${d.isToday ? 'today' : ''} ${showHol ? 'holiday' : ''}`}
                        onClick={() => onDayClick(d.dateString)}
                    >
                        <div className="week-day-header">
                            <span className="week-day-name">{WEEKDAYS_SHORT[i]}</span>
                            <span className="week-day-num">{d.day}</span>
                        </div>
                        {showHol && <div className="week-holiday">{d.holidayName}</div>}
                        <div className="week-events">
                            {dayEvents.length === 0 ? (
                                <div className="week-empty">Sem eventos</div>
                            ) : dayEvents.map(event => (
                                <div
                                    key={event.id}
                                    className={`event-tag event-${event.type}`}
                                    onClick={(e) => onEventClick(e, event)}
                                >
                                    <span className="event-time">{event.time}</span>
                                    {event.title}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function DayView({ currentDate, getEventsForDate, onDayClick, onEventClick }) {
    const dateString = toDateString(currentDate);
    const dayEvents = getEventsForDate(dateString);
    const holidayInfo = isHoliday(dateString);
    const weekday = WEEKDAYS_FULL[currentDate.getDay()];

    return (
        <div className="day-view">
            <div className="day-view-header">
                <div>
                    <div className="day-view-weekday">{weekday}</div>
                    <div className="day-view-date">
                        {currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
                <button className="day-view-add" onClick={() => onDayClick(dateString)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Adicionar evento
                </button>
            </div>
            {holidayInfo && (
                <div className="day-view-holiday">
                    <span className="holiday-dot" />
                    Feriado: {holidayInfo.name}
                </div>
            )}
            <div className="day-view-events">
                {dayEvents.length === 0 ? (
                    <div className="day-view-empty">Nenhum evento neste dia.</div>
                ) : dayEvents.map(event => (
                    <div
                        key={event.id}
                        className={`day-event-card event-${event.type}`}
                        onClick={(e) => onEventClick(e, event)}
                    >
                        <div className="day-event-time">{event.time}</div>
                        <div className="day-event-body">
                            <div className="day-event-title">{event.title}</div>
                            {event.description && <div className="day-event-desc">{event.description}</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ListView({ currentDate, events, showHolidays, onEventClick, onDayClick }) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    const monthEvents = events
        .filter(e => {
            const d = new Date(e.date + 'T12:00:00');
            return d >= monthStart && d <= monthEnd;
        })
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    const grouped = {};
    for (const e of monthEvents) {
        if (!grouped[e.date]) grouped[e.date] = [];
        grouped[e.date].push(e);
    }

    const monthHolidays = showHolidays
        ? getHolidays(currentDate.getFullYear()).filter(h => {
            const hDate = new Date(h.date + 'T12:00:00');
            return hDate.getMonth() === currentDate.getMonth();
        })
        : [];

    const sortedDates = Object.keys(grouped).sort();

    return (
        <div className="list-view">
            {monthHolidays.length > 0 && (
                <div className="list-section">
                    <div className="list-section-title">Feriados do mês</div>
                    {monthHolidays.map((h, i) => {
                        const d = new Date(h.date + 'T12:00:00');
                        return (
                            <div key={i} className="list-holiday-row">
                                <span className="list-day-badge holiday">{d.getDate()}</span>
                                <div className="list-row-body">
                                    <div className="list-row-title">{h.name}</div>
                                    <div className="list-row-meta">{d.toLocaleDateString('pt-BR', { weekday: 'long' })}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="list-section">
                <div className="list-section-title">Eventos do mês</div>
                {sortedDates.length === 0 ? (
                    <div className="list-empty">
                        Nenhum evento neste mês.
                        <button className="list-empty-add" onClick={() => onDayClick(toDateString(currentDate))}>
                            Criar evento
                        </button>
                    </div>
                ) : sortedDates.map(date => {
                    const d = new Date(date + 'T12:00:00');
                    return (
                        <div key={date} className="list-date-group">
                            <div className="list-date-header">
                                <span className="list-date-num">{d.getDate()}</span>
                                <span className="list-date-meta">
                                    {d.toLocaleDateString('pt-BR', { weekday: 'long', month: 'long' })}
                                </span>
                            </div>
                            <div className="list-events">
                                {grouped[date].map(event => (
                                    <div
                                        key={event.id}
                                        className={`list-event-card event-${event.type}`}
                                        onClick={(e) => onEventClick(e, event)}
                                    >
                                        <div className="list-event-time">{event.time}</div>
                                        <div className="list-event-body">
                                            <div className="list-event-title">{event.title}</div>
                                            {event.description && <div className="list-event-desc">{event.description}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
