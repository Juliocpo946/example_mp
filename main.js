let selectedPlanUuid = null;
let selectedPlanData = null;
let mp = null;

function initMercadoPago() {
    if (CONFIG.MERCADOPAGO_PUBLIC_KEY && CONFIG.MERCADOPAGO_PUBLIC_KEY !== 'TEST-your-public-key') {
        mp = new MercadoPago(CONFIG.MERCADOPAGO_PUBLIC_KEY);
        initCardForm();
    }
}

function initCardForm() {
    if (!mp) return;
    
    const cardForm = mp.cardForm({
        amount: "100.00",
        iframe: true,
        form: {
            id: "form-checkout",
            cardNumber: { id: "form-checkout__cardNumber", placeholder: "Numero de tarjeta" },
            expirationDate: { id: "form-checkout__expirationDate", placeholder: "MM/YY" },
            securityCode: { id: "form-checkout__securityCode", placeholder: "CVV" },
            cardholderName: { id: "form-checkout__cardholderName", placeholder: "Titular" },
            issuer: { id: "form-checkout__issuer" },
            installments: { id: "form-checkout__installments" },
            identificationType: { id: "form-checkout__identificationType" },
            identificationNumber: { id: "form-checkout__identificationNumber" },
            cardholderEmail: { id: "form-checkout__cardholderEmail", placeholder: "Email" },
        },
        callbacks: {
            onFormMounted: error => { if (error) console.warn("Form Mounted handling error: ", error) },
            onCardTokenReceived: async (error, token) => {
                if (error) {
                    showResponse(document.getElementById('subscription_response'), 'error', JSON.stringify(error, null, 2));
                    return;
                }
                await createSubscriptionWithToken(token.id);
            },
        },
    });

    const formElement = document.getElementById('form-checkout');
formElement.addEventListener('submit', (e) => {
    e.preventDefault(); // <--- ESTO EVITA LA RECARGA DE LA PÁGINA
});
}

document.addEventListener('DOMContentLoaded', () => {
    initMercadoPago();
});

async function loadPlans() {
    const token = document.getElementById('platform_token').value;
    const responseDiv = document.getElementById('plans_response');
    const plansList = document.getElementById('plans_list');
    
    if (!token) {
        showResponse(responseDiv, 'error', 'Token de plataforma requerido');
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/platforms/${token}/plans`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            showResponse(responseDiv, 'success', JSON.stringify(data, null, 2));
            
            if (data.data && data.data.length > 0) {
                plansList.style.display = 'block';
                plansList.innerHTML = data.data.map(plan => `
                    <div class="plan-item" onclick="selectPlan('${plan.uuid}', '${escapeHtml(plan.name)}', ${plan.price}, '${plan.currency}', '${plan.billing_cycle}')">
                        <div class="plan-name">${escapeHtml(plan.name)}</div>
                        <div class="plan-details">
                            ${plan.code} | ${plan.billing_cycle} | $${plan.price} ${plan.currency}
                            <br>UUID: ${plan.uuid}
                        </div>
                    </div>
                `).join('');
            }
        } else {
            showResponse(responseDiv, 'error', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        showResponse(responseDiv, 'error', error.message);
    }
}

function selectPlan(uuid, name, price, currency, billingCycle) {
    selectedPlanUuid = uuid;
    selectedPlanData = {
        uuid: uuid,
        name: name,
        price: price,
        currency: currency,
        billing_cycle: billingCycle
    };
    
    document.getElementById('plan_uuid').value = uuid;
    document.getElementById('subscription_plan_uuid').value = uuid;
    
    document.querySelectorAll('.plan-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.target.closest('.plan-item').classList.add('selected');
}

async function createAccount() {
    const platformToken = document.getElementById('platform_token').value;
    const storeUuid = document.getElementById('store_uuid').value;
    const storeName = document.getElementById('store_name').value;
    const planUuid = document.getElementById('plan_uuid').value;
    const responseDiv = document.getElementById('account_response');

    if (!platformToken || !storeUuid || !storeName || !planUuid) {
        showResponse(responseDiv, 'error', 'Todos los campos son requeridos');
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/commercial/accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${platformToken}`
            },
            body: JSON.stringify({
                store_uuid: storeUuid,
                store_name: storeName,
                plan_uuid: planUuid
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            showResponse(responseDiv, 'success', JSON.stringify(data, null, 2));
            if (data.data && data.data.api_token) {
                document.getElementById('api_token').value = data.data.api_token;
                document.getElementById('tenant_id').value = storeUuid;
            }
        } else {
            showResponse(responseDiv, 'error', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        showResponse(responseDiv, 'error', error.message);
    }
}

async function createSubscriptionWithToken(cardTokenId) {
    const apiToken = document.getElementById('api_token').value;
    const tenantId = document.getElementById('tenant_id').value;
    const planUuid = document.getElementById('subscription_plan_uuid').value;
    const customerEmail = document.getElementById('form-checkout__cardholderEmail').value;
    const responseDiv = document.getElementById('subscription_response');

    if (!apiToken || !tenantId || !planUuid || !customerEmail) {
        showResponse(responseDiv, 'error', 'Todos los campos son requeridos');
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/commercial/subscriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`
            },
            body: JSON.stringify({
                tenant_id: tenantId,
                plan_uuid: planUuid,
                customer_email: customerEmail,
                card_token_id: cardTokenId
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            showResponse(responseDiv, 'success', JSON.stringify(data, null, 2));
            if (data.data && data.data.subscription_id) {
                document.getElementById('manage_subscription_uuid').value = data.data.subscription_id;
            }
        } else {
            showResponse(responseDiv, 'error', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        showResponse(responseDiv, 'error', error.message);
    }
}

async function manageSubscription() {
    const apiToken = document.getElementById('api_token').value;
    const subscriptionUuid = document.getElementById('manage_subscription_uuid').value;
    const action = document.getElementById('subscription_action').value;
    const responseDiv = document.getElementById('manage_response');

    if (!apiToken || !subscriptionUuid) {
        showResponse(responseDiv, 'error', 'Token y UUID de suscripción requeridos');
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/commercial/subscriptions/${subscriptionUuid}/${action}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            showResponse(responseDiv, 'success', JSON.stringify(data, null, 2));
        } else {
            showResponse(responseDiv, 'error', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        showResponse(responseDiv, 'error', error.message);
    }
}

function showResponse(element, type, content) {
    element.className = `response show ${type}`;
    const pre = document.createElement('pre');
    pre.textContent = content;
    element.innerHTML = '';
    element.appendChild(pre);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}