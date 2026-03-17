export const getHolidays = (year) => {
    // Fixed Holidays
    const fixedHolidays = [
        { date: `${year}-01-01`, name: 'Confraternização Universal' },
        { date: `${year}-04-21`, name: 'Tiradentes' },
        { date: `${year}-05-01`, name: 'Dia do Trabalho' },
        { date: `${year}-09-07`, name: 'Independência do Brasil' },
        { date: `${year}-10-12`, name: 'Nossa Senhora Aparecida' },
        { date: `${year}-11-02`, name: 'Finados' },
        { date: `${year}-11-15`, name: 'Proclamação da República' },
        { date: `${year}-12-25`, name: 'Natal' }
    ];

    // Mobile Holidays (Easter based)
    // Simple Gaussian algorithm for Easter
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);

    // Month is 1-indexed in this result, Day is returned
    const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
    const easterDay = ((h + l - 7 * m + 114) % 31) + 1;

    const easterDate = new Date(year, easterMonth - 1, easterDay);

    // Calculate others based on Easter date
    // Easter is the anchor
    const addDays = (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    // Carnaval (Tuesday) is 47 days before Easter
    const carnavalTuesday = addDays(easterDate, -47);
    const carnavalMonday = addDays(easterDate, -48);
    const carnavalSunday = addDays(easterDate, -49);
    const carnavalSaturday = addDays(easterDate, -50);

    // Ash Wednesday is 46 days before Easter
    const quartaCinzas = addDays(easterDate, -46);

    const sextaFeiraSanta = addDays(easterDate, -2);
    const corpusChristi = addDays(easterDate, 60);

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const mobileHolidays = [
        { date: formatDate(carnavalSaturday), name: 'Sábado de Carnaval' },
        { date: formatDate(carnavalSunday), name: 'Domingo de Carnaval' },
        { date: formatDate(carnavalMonday), name: 'Segunda de Carnaval' },
        { date: formatDate(carnavalTuesday), name: 'Carnaval' },
        { date: formatDate(quartaCinzas), name: 'Quarta-feira de Cinzas' },
        { date: formatDate(sextaFeiraSanta), name: 'Sexta-feira Santa' },
        { date: formatDate(easterDate), name: 'Páscoa' },
        { date: formatDate(corpusChristi), name: 'Corpus Christi' }
    ];

    // Consciência Negra (New National Holiday)
    const conscNegra = { date: `${year}-11-20`, name: 'Dia da Consciência Negra' };

    // Commemorative Dates (Calculated)
    // Mother's Day: 2nd Sunday of May
    const getMothersDay = (y) => {
        const mayFirst = new Date(y, 4, 1);
        const dayOfWeek = mayFirst.getDay(); // 0=Sun, 1=Mon...
        // If May 1st is Sunday (0), 2nd Sunday is May 8.
        // If May 1st is Monday (1), 1st Sunday is May 7, 2nd Sunday is May 14.
        // Formula: 1 + (7 - dayOfWeek) % 7 + 7
        const firstSunday = 1 + ((7 - dayOfWeek) % 7);
        const secondSunday = firstSunday + 7;
        return { date: `${y}-05-${String(secondSunday).padStart(2, '0')}`, name: 'Dia das Mães' };
    };

    // Father's Day: 2nd Sunday of August
    const getFathersDay = (y) => {
        const augFirst = new Date(y, 7, 1);
        const dayOfWeek = augFirst.getDay();
        const firstSunday = 1 + ((7 - dayOfWeek) % 7);
        const secondSunday = firstSunday + 7;
        return { date: `${y}-08-${String(secondSunday).padStart(2, '0')}`, name: 'Dia dos Pais' };
    };

    const mothersDay = getMothersDay(year);
    const fathersDay = getFathersDay(year);

    const commemorativeDates = [
        mothersDay,
        fathersDay,
        conscNegra,
        { date: `${year}-12-24`, name: 'Véspera de Natal' },
        { date: `${year}-12-31`, name: 'Véspera de Ano Novo' }
    ];

    return [...fixedHolidays, ...mobileHolidays, ...commemorativeDates].sort((a, b) => a.date.localeCompare(b.date));
};

export const isHoliday = (dateString) => {
    const year = new Date(dateString).getFullYear();
    const holidays = getHolidays(year);
    return holidays.find(h => h.date === dateString);
};
