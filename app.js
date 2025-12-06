class TravelScheduleApp {
    constructor() {
        this.schedules = [];
        this.editingId = null;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.attachEventListeners();
        this.renderSchedules();
    }

    attachEventListeners() {
        const form = document.getElementById('schedule-form');
        const cancelBtn = document.getElementById('cancel-btn');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        cancelBtn.addEventListener('click', () => {
            this.cancelEdit();
        });
    }

    handleSubmit() {
        const name = document.getElementById('schedule-name').value.trim();
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const notes = document.getElementById('notes').value.trim();

        if (!this.validateTimes(startTime, endTime)) {
            alert('終了時間は開始時間より後である必要があります');
            return;
        }

        if (this.editingId !== null) {
            this.updateSchedule(this.editingId, { name, startTime, endTime, notes });
        } else {
            this.addSchedule({ name, startTime, endTime, notes });
        }

        this.resetForm();
        this.renderSchedules();
    }

    validateTimes(startTime, endTime) {
        return new Date(startTime) < new Date(endTime);
    }

    addSchedule(schedule) {
        const newSchedule = {
            id: Date.now(),
            ...schedule,
            createdAt: new Date().toISOString()
        };
        this.schedules.push(newSchedule);
        this.saveToStorage();
    }

    updateSchedule(id, updatedData) {
        const index = this.schedules.findIndex(s => s.id === id);
        if (index !== -1) {
            this.schedules[index] = {
                ...this.schedules[index],
                ...updatedData
            };
            this.saveToStorage();
        }
    }

    deleteSchedule(id) {
        if (confirm('この予定を削除してもよろしいですか?')) {
            this.schedules = this.schedules.filter(s => s.id !== id);
            this.saveToStorage();
            this.renderSchedules();
        }
    }

    editSchedule(id) {
        const schedule = this.schedules.find(s => s.id === id);
        if (!schedule) return;

        this.editingId = id;
        document.getElementById('schedule-name').value = schedule.name;
        document.getElementById('start-time').value = schedule.startTime;
        document.getElementById('end-time').value = schedule.endTime;
        document.getElementById('notes').value = schedule.notes || '';

        document.getElementById('form-title').textContent = '予定を編集';
        document.getElementById('submit-btn').textContent = '更新';
        document.getElementById('cancel-btn').style.display = 'inline-block';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    cancelEdit() {
        this.resetForm();
    }

    resetForm() {
        document.getElementById('schedule-form').reset();
        this.editingId = null;
        document.getElementById('form-title').textContent = '新しい予定を追加';
        document.getElementById('submit-btn').textContent = '追加';
        document.getElementById('cancel-btn').style.display = 'none';
    }

    renderSchedules() {
        const listContainer = document.getElementById('schedule-list');

        if (this.schedules.length === 0) {
            listContainer.innerHTML = '<p class="empty-message">まだ予定がありません</p>';
            return;
        }

        const sortedSchedules = [...this.schedules].sort((a, b) =>
            new Date(a.startTime) - new Date(b.startTime)
        );

        let html = '';

        // Add insert button at the beginning
        html += this.createInsertButtonHTML('before', null, sortedSchedules[0]);

        // Add schedules with insert buttons between them
        sortedSchedules.forEach((schedule, index) => {
            html += this.createScheduleHTML(schedule);
            if (index < sortedSchedules.length - 1) {
                html += this.createInsertButtonHTML('between', schedule, sortedSchedules[index + 1]);
            }
        });

        // Add insert button at the end
        html += this.createInsertButtonHTML('after', sortedSchedules[sortedSchedules.length - 1], null);

        listContainer.innerHTML = html;
        this.attachScheduleEventListeners();
    }

    createInsertButtonHTML(position, prevSchedule, nextSchedule) {
        let dataAttrs = `data-action="insert" data-position="${position}"`;

        if (prevSchedule) {
            dataAttrs += ` data-prev-end="${prevSchedule.endTime}"`;
        }
        if (nextSchedule) {
            dataAttrs += ` data-next-start="${nextSchedule.startTime}"`;
        }

        return `
            <div class="insert-schedule-container">
                <button class="btn-insert" ${dataAttrs}>
                    <span class="insert-icon">+</span>
                    <span class="insert-text">ここに予定を挿入</span>
                </button>
            </div>
        `;
    }

    insertScheduleAt(prevEndTime, nextStartTime) {
        let suggestedStart, suggestedEnd;

        if (prevEndTime && nextStartTime) {
            // Between two schedules
            const prevEnd = new Date(prevEndTime);
            const nextStart = new Date(nextStartTime);
            const midTime = new Date((prevEnd.getTime() + nextStart.getTime()) / 2);

            suggestedStart = new Date(midTime.getTime() - 30 * 60000); // 30 minutes before mid
            suggestedEnd = new Date(midTime.getTime() + 30 * 60000);   // 30 minutes after mid
        } else if (prevEndTime) {
            // After last schedule
            const prevEnd = new Date(prevEndTime);
            suggestedStart = new Date(prevEnd.getTime() + 60000); // 1 minute after
            suggestedEnd = new Date(suggestedStart.getTime() + 3600000); // 1 hour duration
        } else if (nextStartTime) {
            // Before first schedule
            const nextStart = new Date(nextStartTime);
            suggestedEnd = new Date(nextStart.getTime() - 60000); // 1 minute before
            suggestedStart = new Date(suggestedEnd.getTime() - 3600000); // 1 hour duration
        }

        // Format datetime-local value
        const formatDateTimeLocal = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        document.getElementById('schedule-name').value = '';
        document.getElementById('start-time').value = formatDateTimeLocal(suggestedStart);
        document.getElementById('end-time').value = formatDateTimeLocal(suggestedEnd);
        document.getElementById('notes').value = '';

        document.getElementById('form-title').textContent = '新しい予定を挿入';
        document.getElementById('submit-btn').textContent = '追加';
        document.getElementById('cancel-btn').style.display = 'none';

        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.getElementById('schedule-name').focus();
    }

    createScheduleHTML(schedule) {
        const startDate = new Date(schedule.startTime);
        const endDate = new Date(schedule.endTime);

        const formatDateTime = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}年${month}月${day}日 ${hours}:${minutes}`;
        };

        const notesHTML = schedule.notes
            ? `<div class="schedule-notes">
                <strong>備考:</strong>
                ${this.escapeHTML(schedule.notes)}
               </div>`
            : '';

        return `
            <div class="schedule-item" data-id="${schedule.id}">
                <div class="schedule-header">
                    <div>
                        <div class="schedule-name">${this.escapeHTML(schedule.name)}</div>
                        <div class="schedule-time">
                            <strong>開始:</strong> ${formatDateTime(startDate)}
                        </div>
                        <div class="schedule-time">
                            <strong>終了:</strong> ${formatDateTime(endDate)}
                        </div>
                    </div>
                    <div class="schedule-actions">
                        <button class="btn btn-edit" data-action="edit" data-id="${schedule.id}">編集</button>
                        <button class="btn btn-delete" data-action="delete" data-id="${schedule.id}">削除</button>
                    </div>
                </div>
                ${notesHTML}
            </div>
        `;
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    attachScheduleEventListeners() {
        const listContainer = document.getElementById('schedule-list');

        listContainer.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            if (target.dataset.action === 'edit') {
                this.editSchedule(parseInt(target.dataset.id));
            } else if (target.dataset.action === 'delete') {
                this.deleteSchedule(parseInt(target.dataset.id));
            } else if (target.dataset.action === 'insert') {
                const prevEnd = target.dataset.prevEnd || null;
                const nextStart = target.dataset.nextStart || null;
                this.insertScheduleAt(prevEnd, nextStart);
            }
        });
    }

    saveToStorage() {
        localStorage.setItem('travelSchedules', JSON.stringify(this.schedules));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('travelSchedules');
        if (stored) {
            try {
                this.schedules = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to load schedules from storage', e);
                this.schedules = [];
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TravelScheduleApp();
});
