import {
  Button,
  CircularProgress,
  fade,
  InputBase,
  makeStyles,
} from "@material-ui/core";
import React, { useState } from "react";
import DefaultButton from "../components/DefaultButton";
import DefaultPage from "../components/DefaultPage";
import SearchIcon from "@material-ui/icons/Search";
import { useEffect } from "react";
import { ReactComponent as InboxIcon } from "../../assets/icons/inbox.svg";
import { ReactComponent as AcceptedOrdersIcon } from "../../assets/icons/acceptedOrder.svg";
import { ReactComponent as DeclinedOrdersIcon } from "../../assets/icons/declinedOrder.svg";
import { ReactComponent as DateIcon } from "../../assets/icons/dateIcon.svg";
import { ReactComponent as PriceIcon } from "../../assets/icons/priceIcon.svg";
import fire from "../../fire";
import OrdersTable from "./components/OrdersTable";
import { history } from "../../history";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  grow: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    display: "none",
    [theme.breakpoints.up("sm")]: {
      display: "block",
    },
  },
  search: {
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    "&:hover": {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(3),
      width: "auto",
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#53B175",
  },
  inputRoot: {
    color: "inherit",
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
    border: "1.5px #53B175 solid",
    borderRadius: "10px",
    color: "#53B175",
  },
  sectionDesktop: {
    display: "none",
    [theme.breakpoints.up("md")]: {
      display: "flex",
    },
  },
  sectionMobile: {
    display: "flex",
    [theme.breakpoints.up("md")]: {
      display: "none",
    },
  },
}));

function OrdersInbox() {
  const classes = useStyles();
  const [orders, setOrders] = useState([]);
  const [ref, setRef] = useState([]);
  const [refUser, setRefUser] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentUser = fire.auth().currentUser;
    const userId = localStorage.getItem("userId");
    if (currentUser || userId) {
      setLoading(true);
      const ref = fire
        .firestore()
        .collection("carwash_orders")
        .doc(currentUser?.uid || userId);

      const docSnapshot = ref.get().then((value) => {
        setOrders(
          value.data()?.orders.map((order) => {
            var hh = parseInt(order.time.split(":")[0]);
            var mm = parseInt(order.time.split(":")[1]);
            return {
              ...order,
              time: `${hh < 10 ? `0${hh}` : hh}:${mm < 10 ? `0${mm}` : mm}`,
            };
          }) ?? []
        );
        console.log(value.data()?.orders ?? []);
        setLoading(false);
      });

      setRef(ref);
    } else {
      history.push("/login");
    }
  }, []);

  const handleChangeStatusOrder = (index, status, order) => {
    setLoading(true);
    const _orders = orders;

    _orders[index] = {
      ..._orders[index],
      status: status,
    };
    console.log(orders);
    const ref1 = fire
      .firestore()
      .collection("orders")
      .doc(_orders[index].userid);

    let userOrders = [];
    let userOrderIndex = -1;
    const docSnapshot = ref1.get().then((value) => {
      userOrders = value.data()?.orders ?? [];
      console.log(value.data()?.orders ?? []);
      userOrderIndex = userOrders.findIndex((element, index, array) => {
        console.log(
          element.time,
          order.time,
          element.date == order.date &&
            parseInt(element.time.split(":")[0]) ==
              parseInt(order.time.split(":")[0]) &&
            parseInt(element.time.split(":")[1]) ==
              parseInt(order.time.split(":")[1])
        );
        return (
          element.date == order.date &&
          parseInt(element.time.split(":")[0]) ==
            parseInt(order.time.split(":")[0]) &&
          parseInt(element.time.split(":")[1]) ==
            parseInt(order.time.split(":")[1])
        );
      });
      const _ordersUser = userOrders;

      console.log("TTTBefore", _ordersUser[userOrderIndex]);
      _ordersUser[userOrderIndex] = {
        ..._ordersUser[userOrderIndex],
        status: status,
      };
      console.log("TTTAfter", _ordersUser[userOrderIndex]);

      ref
        .set({
          orders: _orders,
        })
        .then((response) => {
          console.log(response);
          setLoading(false);
          setOrders(_orders ?? []);
        });
      console.log(_orders[index]);
      console.log(_ordersUser);
      console.log(_orders[index].userid ?? "undefined");
      _orders[index].userid &&
        fire
          .firestore()
          .collection("orders")
          .doc(_orders[index].userid)
          .set({
            orders: _ordersUser.filter((e) => e),
          })
          .then((response) => {
            console.log(response);
            setLoading(false);
          });
    });
  };

  return (
    <DefaultPage>
      <div className="cabinet__profile" style={{ display: "flex" }}>
        <div className="tabs">
          <Link to="/orders/inbox" style={{ textDecoration: "none" }}>
            <div className="tab-item active">
              <InboxIcon />
              <p>INBOX</p>
            </div>
          </Link>
          <Link to="/orders/accepted" style={{ textDecoration: "none" }}>
            <div className="tab-item">
              <AcceptedOrdersIcon />
              <p>ORDERS ACCEPTED</p>
            </div>
          </Link>
          <Link to="/orders/declined" style={{ textDecoration: "none" }}>
            <div className="tab-item">
              <DeclinedOrdersIcon />
              <p>ORDERS NOT ACCEPTED</p>
            </div>
          </Link>
        </div>
        <div className="content">
          <div className="title">INBOX NEW ORDERS</div>

          {loading ? (
            <CircularProgress />
          ) : orders.filter((order) => order.status == null).length > 0 ? (
            <div className="orders">
              {orders.map((order, index) => {
                return order.status == null ? (
                  <div className="order_card">
                    <div className="date" style={{ display: "flex" }}>
                      <DateIcon />
                      <p>{order.time}</p>
                      <p>{order.date.split(" ")[0]}</p>
                      <p>{order.carType ?? "Седан"}</p>
                      <p>{order.serviceType ?? "Эконом"}</p>
                    </div>
                    <div className="services">
                      <p>
                        {order.services.map((service) => service.name + ", ")}
                      </p>
                    </div>
                    <div
                      className="cost"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <PriceIcon />
                      <p>{order.price}tg</p>
                    </div>
                    <div className="actions">
                      <button
                        className="accept"
                        onClick={() => {
                          handleChangeStatusOrder(index, "ACCEPTED", order);
                        }}
                      >
                        Accept
                      </button>
                      <button
                        className="decline"
                        onClick={() => {
                          handleChangeStatusOrder(index, "DECLINED", order);
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <div className="no_content">
              <p>No Orders</p>
            </div>
          )}
        </div>
      </div>
    </DefaultPage>
  );
}

export default OrdersInbox;
