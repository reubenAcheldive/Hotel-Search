const inputs = {
  $form: $("#form"),
  $checkIn: $("#check-in"),
  $checkOut: $("#check-out"),
  $search: $("#search-hotel"),
  $saveBtnModal: $("#save-btn"),
};
const ELEMENTS_DYNAMIC = {
  resultHotels: $("#result-hotels"),
  messageId: $(".message-id"),
  creatOption: $("#select-menu"),
  $loadingScreen: $("#loading-screen"),
  $popModal: $(".popModal"),
  $messageModalError: $("#messageVaildModal"),
};

const inputsFromModal = {
  firstName: $(`input[name="firstName"]`).val(),
  lastName: $(`input[name="lastName"]`).val(),
  phoneNumber: $(`input[name="phoneNumber"]`).val(),
  email: $(`input[name="email"]`).val(),
};
const regex = {
  regName: /^[A-Za-z \p{Han}\p{Katakana}\p{Hiragana}\p{Hangul}-]*$/,
  regLastName: /^[A-Za-z \p{Han}\p{Katakana}\p{Hiragana}\p{Hangul}-]*$/,
  regEmail:
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  numberPhoneRegex: /^[+][1-9][0-9]{4,18}$/,
};

const state = {
  token: [],
  searchHotelByUser: [],
  cityCode: [],
  getHotels: [],

  idOffers: "",
};

const API_URLS = {
  cities: "cities.json",
  getTokenApi: `https://test.api.amadeus.com/v1/security/oauth2/token`,
};
main();

function main() {
  hideLoadingScreen();
  $(document).ajaxStart(() => showLoadingScreen("Loading..."));
  $(document).ajaxComplete(() => hideLoadingScreen());
  accessToken();
  apiCities();
  initForm();
  initFormModal();
}
function apiCities() {
  fetchCityList((cities) => {
    cities.forEach(renderCity);
  });
}
function renderCity(city) {
  const el = $(
    `<option  name="${city.cityCode}" value="${city.cityCode}">${city.cityName}</option>`
  );
  const elClass = el.addClass(`${city.cityCode}`);

  ELEMENTS_DYNAMIC.creatOption.append(el);
}
function validateCity(hotel) {
  if (hotel.city === "select") {
    validateCityAlert("please select a city from the list");
  }
}

function initFormModal() {
  const $formModal = $("#formModal");
  $formModal.submit((e) => {
    e.preventDefault();
    const modal = {
      title: $("option:selected").val(),
      firstName: $(`input[name="firstName"]`).val(),
      lastName: $(`input[name="lastName"]`).val(),
      phoneNumber: $(`input[name="phoneNumber"]`).val(),
      email: $(`input[name="email"]`).val(),
    };

    validateModal(modal); // messageOfRegex("")
  });
}
function messageOfRegex(msg) {
  ELEMENTS_DYNAMIC.$messageModalError.empty();
  const msgEl = $(`<p><small>Please enter your ${msg}</small></p>`);
  msgEl.addClass("alert alert-danger").attr("role", "alert");
  ELEMENTS_DYNAMIC.$messageModalError.append(msgEl);
}

function validateModal(modal) {
  console.log("enter validation");
  if (modal.title === "select") {
    messageOfRegex("please select a title");
    $("option:selected").val("");
    return false;
  }
  if (!regex.regName.test(modal.firstName)) {
    messageOfRegex("Full Name");
    $(`input[name="firstName"]`).val("");
    return false;
  }

  if (!regex.regLastName.test(modal.lastName)) {
    messageOfRegex("last Name");
    $(`input[name="lastName"]`).val("");
    return false;
  }

  if (!regex.numberPhoneRegex.test(modal.phoneNumber)) {
    messageOfRegex("Country code or number Phone only");
    $(`input[name="phoneNumber"]`).val();
    return false;
  }
  if (!regex.regEmail.test(modal.email)) {
    messageOfRegex("valid email");
    $(`input[name="email"]`).val();
    return false;
  } else {
    ELEMENTS_DYNAMIC.$messageModalError.empty();

    confirmBooking(modal, state.idOffers);
    hideModalAfterSubmit();

    return true;
  }
}

function show() {
  $("#exampleModal").modal("show");
}

function hide() {
  $("#exampleModal").modal("hide");
}
function hideModalAfterSubmit() {
  $("#btn-close").click(hide());
}

function initForm() {
  const formEl = document.querySelector("#form");
  //set dates check in and out minimum
  formEl.checkIn.min = getMinDate(new Date(), 0);
  formEl.checkOut.min = getMinDate(new Date(), 1);
  const dateInputEl = document.querySelector("#check-in");
  dateInputEl.addEventListener("change", (event) => {
    if (event.target.value != formEl.checkIn.min) {
      const date = new Date(event.target.value);
      formEl.checkOut.min = getMinDate(new Date(date), 1);
    }
  });
  inputs.$form.submit((e) => {
    e.preventDefault();
    const hotel = {
      checkIN: inputs.$checkIn.val(),
      checkOut: inputs.$checkOut.val(),
      city: $("option:selected", ELEMENTS_DYNAMIC.creatOption).val(),
    };

    validateCity(hotel);
    state.searchHotelByUser.push(hotel);
    state.cityCode.push(hotel.city);
    getHotelValue(hotel, (results) => {
      if (results.length !== 0) {
        results.forEach(creatResultElement);
      } else {
        noHotelMessage();
      }
    });

    ELEMENTS_DYNAMIC.resultHotels === $();

    inputs.$form.trigger("reset");
    removeOldResults();
  });
}

function removeOldResults() {
  $("#result-hotels").empty();
  $("body").find(".messageVaildCity").empty();
}

function creatResultElement(result) {
  const urlGoogleMaps = `https://www.google.com/maps/search/?api=1&query=${result.hotelLatitude},${result.hotelLongitude}`;

  const divCard = $(`<div id="main-container" class="card mt-3"></div>`);
  const $div = $(`<div class="row mb-3 card-body" ></div>`);
  const $picture = $(
    ` <div class="col-4" >
      <img class="img-fluid mx-auto mb-5 picture img-thumbnail photo" src="https://source.unsplash.com/800x450/?hotel&id=3${
        Date.now() + 4
      }"></img>
      </div>
      `
  );

  const $hotelName = $(`<div><h4>${result.hotelName}</h4></div>`);

  const $ratingVal = !result.rate
    ? $(`<div class="mb-2" ><p>Not Rated Yet</p></div>`)
    : createStarsRating(result.rate);

  const hotelRating = !result.hotelRating
    ? $(`<div><p></p><div>`)
    : $(`<p >${result.hotelRating}</p>`);
  const hotelLines = !result.hotelLines
    ? $(`<p><a href="${urlGoogleMaps}" target="_blank">navigator hotel</a></p>`)
    : $(
        `<div><p><a href="${urlGoogleMaps}" target="_blank">${result.hotelLines}</a></p> <div>`
      );
  const Description = !result.hotelDescription
    ? $(` <div ><p>Not have a description</p></div>`)
    : $(`
        <div class="row" >
        <strong> Description:</strong>
        <p rows="5" cols="100" class="descriptionFont">  ${result.hotelDescription.text}
        </p>
        </div>`);
  const $div2 = $(`<div class="col-8 "></div>`);

  const priceAndCurrency = $(
    `<span class="col-8"> <p class="btn btn-info"> <strong>Price:</strong> ${result.price}  ${result.currency}</p></span> `
  );
  const hotelAmenities = !result.hotelAmenities
    ? $(`<div class="col-6"><p></p></div>`)
    : $(`<div class="col-6 me-3" ><p>${result.hotelAmenities}</p></div>`);
  const $div3 = $(`<div class="row"></div>`);
  const btnModal = $(
    `<div class="col-12 text-end"><button type="button"  
         class="btn-show btn-primary Modal"  id="${result.hotelId}" >Booking
       </button></div>`
  );
  btnModal.on("click", () => {
    show();
    state.idOffers = result.idOffers;
  });
  $div3.append(priceAndCurrency, hotelAmenities, btnModal);
  $div2.append(
    $hotelName,

    $ratingVal,
    hotelLines,
    Description,
    $div3
  );
  $div.append($picture, $div2);
  divCard.append($div);
  ELEMENTS_DYNAMIC.resultHotels.append(divCard).hide().fadeIn(2000);
}
function createStarsRating(rate) {
  let ratingVal = "";
  for (let i = 0; i < rate; i++) {
    ratingVal += "⭐";
  }
  return $(`<div class="mb-2">
                 ${ratingVal}
            </div>`);
}
function fetchCityList(onFetchResult) {
  $.ajax({
    method: "GET",
    url: API_URLS.cities,
    success: (data) => {
      const cities = Object.entries(data).map((city) => ({
        cityName: city[0],
        cityCode: city[1],
      }));
      onFetchResult(cities);
    },
  });
}
async function accessToken() {
  try {
    await $.ajax({
      type: "POST",
      url: API_URLS.getTokenApi,
      data: {
        client_id: " 7WVMCOuXa30yPwmeOBeanGSsVJN5CfdU",
        client_secret: "d6HPw1RTAl9rXJYe",
        grant_type: "client_credentials",
      },
      success: function (data) {
        const token = Object.values(data.access_token).join("");
        state.token.push(token);
      },
    });
  } catch (e) {
    console.error({ e });
    showError(`${e.statusText}  , please check your concoction`);
  }
}

// getHotelValue(); this function will be active after check if (data.json) worked
async function getHotelValue(form, fetchHotel) {
  try {
    if (state.cityCode.length !== 0) {
      await $.ajax({
        url: `https://test.api.amadeus.com/v2/shopping/hotel-offers?cityCode=${form.city}&checkInDate=${form.checkIN}&checkOutDate=${form.checkOut}`,
        // url: "data.json",
        method: "GET",
        timeout: 0,
        headers: {
          Authorization: `Bearer ${state.token}`,
        },
        success: (data) => {
          const results = data.data.map((result) => ({
            hotelId: result.hotel.hotelId,
            hotelName: result.hotel.name,
            hotelLongitude: result.hotel.longitude,
            hotelLatitude: result.hotel.latitude,
            rate: result.hotel.rating,
            hotelRating: result.hotel.rating,
            hotelLines: result.hotel.address.lines,
            hotelDescription: result.hotel.description,
            amenities: result.hotel.amenities,
            cityName: result.hotel.address.cityName,
            checkInDate: result.offers[0].checkInDate,
            checkOutDate: result.offers[0].checkOutDate,
            currency: result.offers[0].price.currency,
            price: result.offers[0].price.total,
            hotelAmenities: result.offers[0].room.description.text,
            idOffers: result.offers[0].id,
          }));

          fetchHotel(results);
        },
      });
    }
  } catch (e) {
    const error = console.error(e.status);
    if (e.status === 401) {
      accessToken();
    }

    showError(e.statusText);
  }
}
function getMinDate(date, days) {
  const minDate = date;
  minDate.setDate(minDate.getDate() + days);
  minDate.setFullYear(minDate.getFullYear());
  const dayOfMonth = minDate.getDate().toString().padStart(2, "0");
  const month = (minDate.getMonth() + 1).toString().padStart(2, "0");
  const year = minDate.getFullYear();
  const minDateString = [year, month, dayOfMonth].join("-");
  return minDateString;
}
function showLoadingScreen(msg = "Loading...") {
  ELEMENTS_DYNAMIC.$loadingScreen.find(".loading-text").text(msg);
  ELEMENTS_DYNAMIC.$loadingScreen.show();
}

function hideLoadingScreen() {
  ELEMENTS_DYNAMIC.$loadingScreen.hide();
}
function showError(msg) {
  const $notification = $(`
       <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5">
           <div class="toast bg-danger" role="alert" aria-live="assertive" aria-atomic="true">
               <div class="d-flex justify-content-center">  
                   <div class="toast-body text-white">
                    ${msg}
                   </div>
              </div>
           </div>
       </>
  `);
  $("body").append($notification);
  $notification
    .find(".toast")
    .toast({
      autosize: true,
      delay: 2e3,
    })
    .toast("show")
    .on("hidden.bs.toast", () => {
      $notification.remove();
    });
}

function noHotelMessage() {
  const $alert =
    $(`<div class="alert container text-danger text-center alert-dark" role="alert">
  <h4> Please search another hotel </h4>
  </div>`);
  $("body").find(".messageVaildCity").append($alert);
}
function OrderConfirmation(ID) {
  ELEMENTS_DYNAMIC.messageId.empty();
  if (ID) {
    const $el = `
    <div id="messageError" class="container">
    
    
    <div class="alert text-center col-2 alert-success" role="alert">
    <h5> Your Id Order is: ${ID}</h5>
  </div>
  </div>
  
  `;
    ELEMENTS_DYNAMIC.messageId.append($el).show().fadeOut(5000);
  }
}

function removeOldOrderID() {
  ELEMENTS_DYNAMIC.$messageId.find("#messageError").fadeOut("slow").remove();
  state.idMessageForHotel = [];
}
function validateCityAlert(message) {
  const $msg = $(`
    <div class="container">
         <div class="row">
               <div class="col">
                         <div class="alert alert-danger text-center" role="alert">
                           <strong> ${message} </strong>
                           </div>
                 </div>
        </div>
    </div>

    `);
  $msg.fadeIn();
  $(".errorCitySelected").append($msg);
  $("body")
    .find($msg)
    .fadeOut(5000, () => {
      $(this).remove();
    });
}

async function confirmBooking(modal, id) {
  try {
    var settings = {
      url: "https://test.api.amadeus.com/v1/booking/hotel-bookings",
      method: "POST",
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
        Authorization: ` Bearer ${state.token}`,
      },
      data: JSON.stringify({
        data: {
          offerId: `${id}`,
          guests: [
            {
              id: 1,
              name: {
                title: `${modal.title}`,
                firstName: `${modal.firstName}`,
                lastName: `${modal.lastName}`,
              },
              contact: {
                phone: `${modal.phoneNumber}`,
                email: `${modal.email}`,
              },
            },
          ],
          payments: [
            {
              id: 1,
              method: "creditCard",
              card: {
                vendorCode: "VI",
                cardNumber: "4151289722471370",
                expiryDate: "2021-08",
              },
            },
          ],
          rooms: [
            {
              guestIds: [1],
              paymentId: 1,
              specialRequest: "I will arrive at midnight",
            },
          ],
        },
      }),
    };

    await $.ajax(settings).done(function (response) {
      console.log({ response });
      OrderConfirmation(id);
    });
  } catch (e) {
    console.log(e);
    errorNoRooms(e.responseJSON.errors[0].title);
  }
}
function errorNoRooms(e) {
  ELEMENTS_DYNAMIC.messageId.empty();
  const el = $(`<div class="alert  alert-info " role="alert">
  <h4 class="text-center" >${e}</h4>
  
</div>`);
  ELEMENTS_DYNAMIC.messageId.append(el).show().fadeOut(5000);
}
