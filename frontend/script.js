// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('themeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');
const body = document.body;

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  body.classList.add('dark');
  if (sunIcon && moonIcon) {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  }
}

// Theme toggle handler
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
    const isDark = body.classList.contains('dark');

    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDark ? 'none' : 'block';
      moonIcon.style.display = isDark ? 'block' : 'none';
    }

    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

// ===== DASHBOARD PAGE (index.html) =====
if (document.getElementById('avgChart')) {
  document.addEventListener('DOMContentLoaded', async () => {
    const url = 'http://localhost:8000/api/sensor';

    try {
      const res = await fetch(url);
      const data = await res.json();

      // Update Stats
      const maxTempEl = document.getElementById('maxTemp');
      const minTempEl = document.getElementById('minTemp');
      const avgTempEl = document.getElementById('avgTemp');

      if (maxTempEl) {
        maxTempEl.innerHTML = `${data.suhumax}<span class="stat-unit">°C</span>`;
      }
      if (minTempEl) {
        minTempEl.innerHTML = `${data.suhummin}<span class="stat-unit">°C</span>`;
      }
      if (avgTempEl) {
        avgTempEl.innerHTML = `${data.suhurata}<span class="stat-unit">°C</span>`;
      }

      // Update Sensor Table
      const tbody = document.querySelector('#sensorTable tbody');
      if (tbody) {
        tbody.innerHTML = '';
        data.nilai_suhu_max_humid_max.forEach((item) => {
          tbody.innerHTML += `
            <tr>
              <td>${item.idx}</td>
              <td>${item.suhun}°C</td>
              <td>${item.humid}%</td>
              <td>${item.kecerahan}</td>
              <td>${item.timestamp}</td>
            </tr>`;
        });
      }

      // Update Month Table
      const myTbody = document.querySelector('#monthTable tbody');
      if (myTbody) {
        myTbody.innerHTML = '';
        data.month_year_max.forEach((item) => {
          myTbody.innerHTML += `<tr><td>${item.month_year}</td></tr>`;
        });
      }

      // Chart
      const chartCanvas = document.getElementById('avgChart');
      if (chartCanvas) {
        const ctx = chartCanvas.getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Suhu Max', 'Suhu Min', 'Suhu Rata-rata'],
            datasets: [{
              label: 'Nilai Suhu (°C)',
              data: [data.suhumax, data.suhummin, data.suhurata],
              backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
              borderRadius: 8,
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                borderRadius: 8,
                titleFont: {
                  size: 14,
                  weight: 'bold'
                },
                bodyFont: {
                  size: 13
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  font: {
                    size: 12
                  }
                }
              },
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  font: {
                    size: 12
                  }
                }
              }
            }
          }
        });
      }

    } catch (err) {
      console.error('❌ Gagal mengambil data:', err);

      // Show error in UI
      const errorElements = document.querySelectorAll('.loading');
      errorElements.forEach(el => {
        el.textContent = 'Gagal memuat data. Periksa koneksi API.';
        el.style.color = '#ef4444';
      });
    }
  });
}

// ===== PAGE TRANSITION =====
window.addEventListener('load', () => {
  document.body.classList.add('fade-in');
});

// Smooth page transitions
const navLinks = document.querySelectorAll('a[href]');
navLinks.forEach(link => {
  // Only apply to same-domain links
  if (link.hostname === window.location.hostname && !link.getAttribute('href').startsWith('#')) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const url = link.href;

      document.body.classList.remove('fade-in');
      document.body.style.opacity = '0';

      setTimeout(() => {
        window.location.href = url;
      }, 300);
    });
  }
});