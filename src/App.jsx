import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Modal } from "bootstrap";

// 定義基本的 API 路徑
const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

// 產品Modal預設資料
const defaultModalState = {
  imageUrl: "",
  title: "",
  category: "",
  unit: "",
  origin_price: "",
  price: "",
  description: "",
  content: "",
  is_enabled: 0,
  imagesUrl: [""],
};

function App() {
  const [isAuth, setIsAuth] = useState(false); // 驗證狀態
  const [products, setProducts] = useState([]); // 產品列表
  const [account, setAccount] = useState({
     username: "example@test.com",
      password: "example"
  });
  const [tempProduct, setTempProduct] = useState(defaultModalState); // 用於編輯或創建產品時的暫存資料

  // 處理帳號輸入變更
  const handleInputChange = (e) => {
    const { value, name } = e.target;
    setAccount({
      ...account,
      [name]: value,
    });
  };

  // 處理登入
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}/v2/admin/signin`, account);
      const { token, expired } = res.data;
      document.cookie = `hexToken=${token}; expires=${new Date(expired)}`;
      axios.defaults.headers.common["Authorization"] = token;
      getProducts();
      setIsAuth(true);
    } catch (error) {
      alert("登入失敗", error);
    }
  };

  // 取得產品資料
  const getProducts = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/v2/api/${API_PATH}/admin/products`
      );
      setProducts(res.data.products);
    } catch (error) {
      alert("取得產品失敗");
    }
  };

  // 檢查用戶是否已登入
  const checkUserLogin = async () => {
    try {
      await axios.post(`${BASE_URL}/v2/api/user/check`);
      getProducts();
      setIsAuth(true);
    } catch (error) {
      console.error(error.response.data);
    }
  };

  // 頁面加載時設置 token 並檢查登入狀態
  useEffect(() => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)hexToken\s*\=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    axios.defaults.headers.common["Authorization"] = token;
    checkUserLogin();
  }, []);


  const productModalRef = useRef(null);
  const delProductModalRef = useRef(null);

  // 設置編輯新增 
  const [modalMode, setModalmode] = useState(null);

  // 初始化 Modal
  useEffect(() => {
    new Modal(productModalRef.current, { backdrop: false });
    new Modal(delProductModalRef.current, { backdrop: false });
  }, []);

  // 開啟產品編輯或新增 Modal
  const handleOpenProductModal = (mode, product) => {
    setModalmode(mode);
    switch (mode) {
      case "create":
        setTempProduct(defaultModalState);
        break;
      case "edit":
        setTempProduct(product);
        break;
      default:
        break;
    }
    Modal.getInstance(productModalRef.current).show();
  };

  // 關閉
  const handleCloseProductModal = () => {
    Modal.getInstance(productModalRef.current).hide();
  };

  // 刪除
  const handleOpenDelProductModal = (product) => {
    setTempProduct(product);
    Modal.getInstance(delProductModalRef.current).show();
  };

  // 關閉刪除
  const handleCloseDelProductModal = () => {
    Modal.getInstance(delProductModalRef.current).hide();
  };

  // 處理編輯產品的輸入變更
  const handleModalInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setTempProduct({
      ...tempProduct,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // 處理副圖輸入變更
  const handleImageChang = (e, index) => {
    const { value } = e.target;
    const newImages = [...tempProduct.imagesUrl];
    newImages[index] = value;
    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages,
    });
  };

  // 新增圖片
  const addImg = () => {
    const newImages = [...tempProduct.imagesUrl, ""];
    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages,
    });
  };

  // 刪除圖片
  const deleteImg = () => {
    const newImages = [...tempProduct.imagesUrl];
    newImages.pop();
    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages,
    });
  };

  // 創建新產品 API 請求
  const createProduct = async () => {
    try {
      await axios.post(`${BASE_URL}/v2/api/${API_PATH}/admin/product`, {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0,
        },
      });
    } catch (error) {
      alert("產品創建失敗");
    }
  };

  // 刪除產品 API 請求
  const deleteProduct = async () => {
    try {
      await axios.delete(
        `${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`
      );
    } catch (error) {
      alert("刪除產品失敗");
    }
  };

  // 處理刪除產品操作
  const handleDeleteProduct = async () => {
    try {
      await deleteProduct();
      getProducts();
      handleCloseDelProductModal();
    } catch (error) {
      alert("刪除產品失敗");
    }
  };

  // 更新或新增產品
  const handleUpdateProduct = async () => {
    const apiCall = modalMode === "create" ? createProduct : updateProduct;
    try {
      await apiCall();
      getProducts();
      handleCloseProductModal();
    } catch (error) {
      alert("更新失敗");
    }
  };

  // 更新產品 API 請求
  const updateProduct = async () => {
    try {
      await axios.put(
        `${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`,
        {
          data: {
            ...tempProduct,
            origin_price: Number(tempProduct.origin_price),
            price: Number(tempProduct.price),
            is_enabled: tempProduct.is_enabled ? 1 : 0,
          },
        }
      );
    } catch (error) {
      alert("編輯產品失敗");
    }
  };

  return (
    <>
      {isAuth ? (
        <div className="container mt-5">
          <div className="row">
            <div className="col">
              <div className="d-flex justify-content-between">
                <h2>產品列表</h2>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleOpenProductModal("create")}
                >
                  建立新的產品
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">產品名稱</th>
                    <th scope="col">原價</th>
                    <th scope="col">售價</th>
                    <th scope="col">是否啟用</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  {/* 渲染產品資料 */}
                  {products.map((product) => (
                    <tr key={product.id}>
                      <th scope="row">{product.title}</th>
                      <td>{product.origin_price}</td>
                      <td>{product.price}</td>
                      <td>
                        {product.is_enabled ? (
                          <span className="text-success">啟用</span>
                        ) : (
                          <span>未啟用</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() =>
                              handleOpenProductModal("edit", product)
                            }
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleOpenDelProductModal(product)}
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100">
          <h1 className="mb-5">請先登入</h1>
          <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
            <div className="form-floating mb-3">
              <input
                name="username"
                value={account.username}
                onChange={handleInputChange}
                type="email"
                className="form-control"
                id="username"
                placeholder="name@example.com"
              />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating">
              <input
                name="password"
                value={account.password}
                onChange={handleInputChange}
                type="password"
                className="form-control"
                id="password"
                placeholder="Password"
              />
              <label htmlFor="password">Password</label>
            </div>
            <button className="btn btn-primary">登入</button>
          </form>
        </div>
      )}

      {/* 產品編輯/創建模態視窗 */}
      <div
        className="modal fade"
        ref={productModalRef}
        tabIndex="-1"
        aria-labelledby="productModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="productModalLabel">
                {modalMode === "create" ? "創建產品" : "編輯產品"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={handleCloseProductModal}
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">產品名稱</label>
                <input
                  name="title"
                  type="text"
                  className="form-control"
                  value={tempProduct.title}
                  onChange={handleModalInputChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">類別</label>
                <input
                  name="category"
                  type="text"
                  className="form-control"
                  value={tempProduct.category}
                  onChange={handleModalInputChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">單位</label>
                <input
                  name="unit"
                  type="text"
                  className="form-control"
                  value={tempProduct.unit}
                  onChange={handleModalInputChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">描述</label>
                <textarea
                  name="description"
                  className="form-control"
                  value={tempProduct.description}
                  onChange={handleModalInputChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">內容</label>
                <textarea
                  name="content"
                  className="form-control"
                  value={tempProduct.content}
                  onChange={handleModalInputChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">原價</label>
                <input
                  name="origin_price"
                  type="number"
                  className="form-control"
                  value={tempProduct.origin_price}
                  onChange={handleModalInputChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">售價</label>
                <input
                  name="price"
                  type="number"
                  className="form-control"
                  value={tempProduct.price}
                  onChange={handleModalInputChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-check-label">是否啟用</label>
                <input
                  name="is_enabled"
                  className="form-check-input"
                  type="checkbox"
                  checked={tempProduct.is_enabled}
                  onChange={handleModalInputChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">圖片網址</label>
                <div className="input-group">
                  <input
                    name="imageUrl"
                    className="form-control"
                    type="text"
                    value={tempProduct.imageUrl}
                    onChange={handleModalInputChange}
                  />
                </div>
                <div className="mt-2">
                  {tempProduct.imagesUrl.map((img, index) => (
                    <div key={index} className="mb-2">
                      <input
                        className="form-control"
                        type="text"
                        value={img}
                        onChange={(e) => handleImageChang(e, index)}
                      />
                    </div>
                  ))}
                </div>
                <div className="mb-2">
                  <button
                    type="button"
                    className="btn btn-outline-success"
                    onClick={addImg}
                  >
                    新增圖片
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={deleteImg}
                  >
                    刪除圖片
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={handleCloseProductModal}
              >
                關閉
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpdateProduct}
              >
                {modalMode === "create" ? "創建" : "更新"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 刪除產品模態視窗 */}
      <div
        className="modal fade"
        ref={delProductModalRef}
        tabIndex="-1"
        aria-labelledby="deleteModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteModalLabel">
                確認刪除產品
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={handleCloseDelProductModal}
              ></button>
            </div>
            <div className="modal-body">
              <p>您確定要刪除這個產品嗎？</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={handleCloseDelProductModal}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteProduct}
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
