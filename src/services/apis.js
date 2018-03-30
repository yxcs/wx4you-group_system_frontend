import axios from '../../dependencies/node_modules/axios';
import * as config from '../config.js';

axios.defaults.withCredentials = true

// 添加请求拦截器
axios.interceptors.request.use(function (config) {
  var cookies = document.cookie;
  var cookiesObj = {}
  cookies = cookies.split(';')
  cookies.forEach(item => {
    item = item.trim();
    var keyValue = item.split('=')
    cookiesObj = { ...cookiesObj, [keyValue[0]]: keyValue[1]}
  })
  
  if (!cookiesObj['remember-me']) {
    var redirectUrl = location.pathname;
    if (redirectUrl !== '/signUp' && redirectUrl.indexOf('h5') === -1) {
      location.replace(`${location.protocol}//${location.host}/signUp?redirect_uri=${redirectUrl}`) 
    }
  }
  return config;
}, function (error) {
  // 对请求错误做些什么
  return Promise.reject(error);
});

// 添加响应拦截器
axios.interceptors.response.use(function (response) {
  // 对响应数据做点什么
  return response;
}, function (error) {
  // 对响应错误做点什么
  return Promise.reject(error);
});

export const addGroup = (params) => {
  return axios.post(
    `${config.baseUrl}:${config.port}/group/add`, {
      ...params
    }
  );
};

export const updateGroup = (params) => {
  return axios.post(
    `${config.baseUrl}:${config.port}/group/update`, {
      ...params
    }
  );
};

export const getAllGroups = (params) => {
  return axios.post(
    `${config.baseUrl}:${config.port}/group/searchList`, {
      ...params
    }
  );
};

export const getGroupDetail = (groupId) => {
  return axios.get(`${config.baseUrl}:${config.port}/group/detail/${groupId}`);
};

export const uploadAvatar = (dataArr) => {
  return new Promise((resolve, reject) => {
    let formData = new FormData();
    let imgFile = new File(dataArr, Date.now() + '.jpg', {type: 'image/jpg'});
    console.log(URL.createObjectURL(imgFile));
    formData.append('imageFile', imgFile);
    // let fileReader = new FileReader();
    // fileReader.readAsArrayBuffer(blob);
    // fileReader.addEventListener('loadend', _ => {
    //   let imgFile = new File(fileReader.result, Date.now() + '.jpg', {type: 'image/jpeg'});
    //   console.log(imgFile);
    //   resolve(formData);
    // });
    resolve(formData);
  }).then(formData => {
    // axios({
    //   url: `http://qf-restapi.mdscj.com/product/image/save`,
    //   method: 'post',
    //   headers: {
    //     'Content-Type': 'multipart/form-data',
    //     'X-Requested-With': 'XMLHttpRequest',
    //   },
    //   data: formData
    // });
    return 'http://img-prod.kkkd.com/FiqzCHzcPlJbikLt4RTmB6G58sGu'
  });
  // return axios.post(
  //   , {
  //     data: formData
  //   }
  // );
};

export const addRobot = (params) => {
  return axios.post(
    `${config.baseUrl}:${config.port}/robot/save`, {
      ...params
    }
  );
};

export const bindRobot = (params) => {
  return axios.post(
    `${config.baseUrl}:${config.port}/group/bindGroupRobot`, {
      ...params
    }
  );
};

export const getRobotsStatus = (params) => {
  return axios.post(
    `${config.formalUrl}:${config.formalPort}/getRobotsStatus`, {
      ...params
    }
  );
};

export const getAllRobots = (params) => {
  return axios.post(
    `${config.baseUrl}:${config.port}/robot/save`
  );
};

export const updateAddReply = (params) => {
  return axios.post(
    `${config.formalUrl}:${config.formalPort}/updateAddReply`, {
      ...params
    }
  );
};

export const getAllActivity = (params) => {
    return axios.post(
        `${config.baseUrl}:${config.port}/activity/searchList`, {
            ...params
        }
    );
};

export const addActivity = (params) => {
    return axios.post(
        `${config.baseUrl}:${config.port}/activity/save`, {
            ...params
        }
    );
};

export const editActivity = (params) => {
    return axios.post(
        `${config.baseUrl}:${config.port}/activity/bindActivityGroup`, {
            ...params
        }
    );
};

export const getActivityById = (activityId) => {
    return axios.get(
        `${config.baseUrl}:${config.port}/activity/detail/${activityId}`
    );
};

export const getH5Page = (activityId) => {
    return axios({
      url: `${config.baseUrl}:${config.port}/h5/activityDetail/${activityId}`,
      method: 'get',
      withCredentials: true
    });
};

export const deleteGroup = (groupId) => {
  return axios({
    url: `${config.baseUrl}:${config.port}/group/delete/${groupId}`,
    method: 'post'
  })
}

// 获取机器人列表
export const getRobotsList = (params) => {
  return axios.post(
    `${config.baseUrl}:${config.port}/robot/searchList`, {
    ...params
  })
}

// 获取机器人详情
export const getRobotById = (robotId) => {
  return axios.get(
      `${config.baseUrl}:${config.port}/robot/detail/${robotId}`
  );
};

// 获取活动标签
export const getActivityTag = () => {
  return axios.get(
      `${config.baseUrl}:${config.port}/tag/activityList`
  );
};

// 获取群标签
export const getGroupTag = () => {
  return axios.get(
      `${config.baseUrl}:${config.port}/tag/groupList`
  );
};


// 获取尚未绑定的群
export const getUnbindGroup = (params) => {
  return axios.post(
      `${config.baseUrl}:${config.port}/group/searchBindGroup`, {
        ...params
      }
  );
};

// 用户登录 
export const userLogin = (params) => {
  return axios.post(
    'http://tk-auth-bos.xuanwonainiu.com/login?'+params, {}
  );
};

// 用户退出
export const userLogout = (params) => {
  return axios.post(
      'http://tk-auth-bos.xuanwonainiu.com/logout', {
        ...params
      }
  );
};