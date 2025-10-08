
// auth/urls.js
import { register, login, logout,users,createUser,updateUser,profile} from "./views.js";
import { authenticate } from "../../core/middlewares/Authmiddleware.js";

export const authUrls = [
  { method: "put",  path: "/auth/updateuser/:id",   view: updateUser, name: "updateuser" },
  { method: "post", path: "/auth/createuser",       view: createUser, name: "createuser" },
  { method: "get",  path: "/auth/user/:id",         view: profile,    name: "profile" },
  { method: "get",  path: "/auth/users",            view: users,      name: "users" },
  { method: "post", path: "/auth/register",         view: register,   name: "register" },
  { method: "post", path: "/auth/login",            view: login,      name: "login" },
  { method: "post", path: "/auth/logout",           view: logout,     name: "logout" , }
];
