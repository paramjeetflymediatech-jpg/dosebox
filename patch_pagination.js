const fs = require('fs');

const path = 'd:\\dosebox\\src\\app\\dashboard\\customer\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add states
content = content.replace(
  `  const [loadingData, setLoadingData] = useState(true);`,
  `  const [loadingData, setLoadingData] = useState(true);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [prescriptionsPage, setPrescriptionsPage] = useState(1);
  const [prescriptionsTotalPages, setPrescriptionsTotalPages] = useState(1);`
);

// Replace loadDashboardData effect
const oldEffect = `  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = '/';
      return;
    }

    async function loadDashboardData() {
      setLoadingData(true);
      try {
        const [ordersRes, prescRes] = await Promise.all([
          api.get('/orders'),
          api.get('/prescriptions/customer')
        ]);
        if (ordersRes.data?.success) setOrders(ordersRes.data.data);
        if (prescRes.data?.success) setPrescriptions(prescRes.data.data);
      } catch (err) {
        console.error('Failed to load customer profile details', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadDashboardData();
  }, [user, authLoading]);`;

const newEffect = `  const loadOrders = async (page: number) => {
    try {
      const res = await api.get(\`/orders?page=\${page}&limit=10\`);
      if (res.data?.success) {
        setOrders(res.data.data);
        if (res.data.pagination) setOrdersTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    }
  };

  const loadPrescriptions = async (page: number) => {
    try {
      const res = await api.get(\`/prescriptions/customer?page=\${page}&limit=10\`);
      if (res.data?.success) {
        setPrescriptions(res.data.data);
        if (res.data.pagination) setPrescriptionsTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load prescriptions', err);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = '/';
      return;
    }
    
    setLoadingData(true);
    Promise.all([
      loadOrders(ordersPage),
      loadPrescriptions(prescriptionsPage)
    ]).finally(() => setLoadingData(false));
  }, [user, authLoading]);

  // Handle individual pagination
  useEffect(() => {
    if (user && !loadingData) loadOrders(ordersPage);
  }, [ordersPage]);

  useEffect(() => {
    if (user && !loadingData) loadPrescriptions(prescriptionsPage);
  }, [prescriptionsPage]);`;

content = content.replace(oldEffect, newEffect);

// Add order pagination controls
content = content.replace(
  `              })
            )}
          </div>
        )}`,
  `              })
            )}

            {/* Orders Pagination */}
            {ordersTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-2xl shadow-sm mt-6">
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-700">
                      Showing page <span className="font-medium">{ordersPage}</span> of <span className="font-medium">{ordersTotalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                        disabled={ordersPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setOrdersPage(p => Math.min(ordersTotalPages, p + 1))}
                        disabled={ordersPage === ordersTotalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}`
);

// Add prescription pagination controls
content = content.replace(
  `                  ))}
                </div>
              )}
            </div>
          </div>
        )}`,
  `                  ))}
                </div>
              )}

              {/* Prescriptions Pagination */}
              {prescriptionsTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-2xl shadow-sm mt-6">
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-700">
                        Showing page <span className="font-medium">{prescriptionsPage}</span> of <span className="font-medium">{prescriptionsTotalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setPrescriptionsPage(p => Math.max(1, p - 1))}
                          disabled={prescriptionsPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPrescriptionsPage(p => Math.min(prescriptionsTotalPages, p + 1))}
                          disabled={prescriptionsPage === prescriptionsTotalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully added pagination');
