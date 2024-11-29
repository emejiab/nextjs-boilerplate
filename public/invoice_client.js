/**
 * Created by elponchotrucker on 07/02/18.
 */
var alldone = true;
var cargando = 0;
var hash = '';
var myTimer;
$regimenselected = 0;
$fisica = 1;
$generico = 0;
$try = 0;
$(document).ready(function() {
    $('.factura_form').submit(function(e) {
        e.preventDefault();
        var form = $(this);
        form.parsley().validate();
        if (form.parsley().isValid()){
            $("#rfc_field").val().toUpperCase()
            $(':input[type="submit"]').prop('disabled', true);
            $("#sendinvoice").html('<i class="fa fa-clock-o"></i> Facturando ....');
            if(!alldone){

            }else{
                $('#modalloading').modal(
                    {
                        backdrop: 'static',
                        keyboard: false
                    }
                );
                myTimer = setInterval(loading, 200);
                var formValues = $(this).serialize();
                $.post("/process/makecfdi", formValues, function(data){
                    // Display the returned data in browser
                    data = $.parseJSON( data );
                    if(data.status == 'ok'){
                        //console.log('Aqui')
                        $try = $try+1;
                        $("#try_field").val($try);
                        hash = data.id;
                    }else{
                        //console.log('Aqui error')
                        hash = 'error';
                    }
                });
            }
        }
    });


    $('#cp_field').select2({
        placeholder: '* INGRESAA el código postal de tu domicilio fiscal',
        cache: false,
        language: "es",
        delay: 250,
        width: '100%',
        tags: true,
        tokenSeparators: [',',''],
        ajax: {
            url: '/data/cpsf',
            type: 'POST',
            dataType: 'json',
            processResults: function (data) {
                return {
                    results: data
                };
            }
        },
        minimumInputLength: 5,
        createTag: function (tag) {
            var res = tag.term.replace(/\D/g, "");
            if(res.length >= 5){
            $("#cpalter_field").val(res);
                return {
                    id: 0,
                    text: res+' - OTRA NO ESPECIFICADA EN EL CATALOGO',
                    isNew : true,
                };
            }

        },
    });

    $(':input[type="submit"]').prop('disabled', false);
    $("#cfdiuse_field").select2();
    $("#regimen_field").select2();
    if( $('#metodopago_field').length > 0 ) {
        $("#metodopago_field").select2();
    }

    if( $('#formapago_field').length > 0 ) {
        $("#formapago_field").select2();
    }

    $('body').tooltip({
        selector: "[data-toggle=tooltip]",
        container: "body"
    });
    //$('#cfdiuse_field').select2("disabled",false)
    if($("#rfc_field").val() != ''){
        $cadena = $("#rfc_field").val();
        $cadena = $cadena.replace(/\s/g, "");
        $cadena = $cadena.replace(/[^a-zA-Z0-9-&-ñ-Ñ]/g,'');
        $cadena = $cadena.replace(/-/g, "");
        $("#rfc_field").val($cadena.toUpperCase());
        if($cadena.length == 12){
            $fisica = 0;
        }else{
            $fisica = 1;
        }
    }
    reloadselect();
    reloadcfdiuse();
    $(".factura_form").parsley();
    /*$('#modalsuccess').modal(
        {
            backdrop: 'static',
            keyboard: false
        }
    );*/
    //myTimer = setInterval(loading, 100);
});



function loading() {
    cargando += .5;
    if(hash == 'error'){
        clearInterval(myTimer);
    }

    if(cargando <= 100){
        document.getElementById("loadingbar").style.width = cargando+'%';
        if((cargando % 5)==0){
            if(hash != '' && hash != 'error'){
                console.log(hash)
                checkstatus();
            }
        }
    }
}

function checkstatus(){
    $.ajax({
        type: "POST",
        headers: {"cache-control": "no-cache"},
        url: "/process/checkinvoicestatus",
        dataType: "json",
        data: {hash:hash},
        success: function (data) {
            //console.log(data.response)
            if(data.response != 'attemp'){
                if(data.response != 'success'){
                    hash = '';
                    cargando = 0;
                    $('#modalloading').modal('toggle');
                    $('#modaltittle').html(data.title)
                    $('#messagecontainer').html(data.message)
                    $('#modalerrores').modal();
                    $(':input[type="submit"]').prop('disabled', false);
                    $("#sendinvoice").html('<i class="fa fa-file-pdf-o"></i>&nbsp; Generar Factura &nbsp; <i class="fa fa-chevron-right"></i>');
                    document.getElementById("loadingbar").style.width = cargando+'%';
                }else{
                    //Factura emitida generamos un modal con la pantalla de gracias
                    if($('#slick_demo_3').length > 0) {
                        $('.slick_demo_3').slick({
                            slidesToShow: 3,
                            slidesToScroll: 1,
                            autoplay: true,
                            infinite: true,
                            autoplaySpeed: 2000,
                            responsive: [
                                {
                                    breakpoint: 480,
                                    settings: {
                                        slidesToShow: 2,
                                        slidesToScroll: 1,
                                        infinite: true
                                    }
                                }
                            ]
                        });
                    }
                    $('#modalloading').modal('toggle');
                    $('#modalsuccess').modal(
                        {
                            backdrop: 'static',
                            keyboard: false
                        }
                    );
                }
                clearInterval(myTimer);
                console.log(data.response);
                console.log(data.message);
            }
            /*if (data.status == 'success') {
                alldone = true;
                $('.factura_form').submit();
            }else if(data.status == 'noexist') {
                $(".rfcinvalid").html($rfcvalue);
                $('#ModalRfc').modal('show');
                $(':input[type="submit"]').prop('disabled', false);
                $("#sendinvoice").html('<i class="fa fa-file-pdf-o"></i>&nbsp; Generar Factura &nbsp; <i class="fa fa-chevron-right"></i>');
            }*/
        },
        failure: function (errMsg) {
            console.log("Error interno");
        }
    });
}

$('#regimen_field').on('select2:select', function (e) {
    var data = e.params.data;
    $regimenselected = data.idsat;
    console.log($regimenselected);
    reloadcfdiuse();
});

function reloadcfdiuse(){
    $("#cfdiuse_field").empty();
    $("#cfdiuse_field").select2("destroy");
    var uso_cfdi = [];
    obj = JSON.parse(atob(lista));
    for (x in obj) {
        if($fisica == 1) {
            if(obj[x].fisica == 1) {
                if(cfdiusesaved == obj[x].uso) {
                    uso_cfdi.push({'id':obj[x].id,'text':obj[x].uso+" - "+obj[x].description,'selected':'selected'});
                }else {
                    if($generico == 1){
                        if(obj[x].uso == 'S01'){
                            uso_cfdi.push({'id':obj[x].id,'text':obj[x].uso+" - "+obj[x].description});
                        }
                    }else {
                        if($regimenselected != 0){
                            usecfdivalid = obj[x].regimenvalid;
                            usecfdivalid = usecfdivalid.replace(/\s/g, '');
                            usecfdivalid = usecfdivalid.split(",");
                            for (var i = 0; i < usecfdivalid.length; i++) {
                                if($regimenselected == usecfdivalid[i]){
                                    uso_cfdi.push({'id':obj[x].id,'text':obj[x].uso+" - "+obj[x].description});
                                    break;
                                }
                            }
                        }else{
                            //Colocamos una opcion vacia
                            uso_cfdi.push({'id':'','text':'Primero selecciona tu régimen fiscal','selected':'selected'});
                            break;
                        }
                    }
                }
            }
        }else {
            if(obj[x].moral == 1) {
                if(cfdiusesaved == obj[x].uso){
                    uso_cfdi.push({'id':obj[x].id,'text':obj[x].uso+" - "+obj[x].description,'selected':'selected'});
                }else {
                    if($regimenselected != 0){
                        usecfdivalid = obj[x].regimenvalid;
                        usecfdivalid = usecfdivalid.replace(/\s/g, '');
                        usecfdivalid = usecfdivalid.split(",");
                        for (var i = 0; i < usecfdivalid.length; i++) {
                            if($regimenselected == usecfdivalid[i]){
                                uso_cfdi.push({'id':obj[x].id,'text':obj[x].uso+" - "+obj[x].description});
                                break;
                            }
                        }
                    }else{
                        //Colocamos una opcion vacia
                        uso_cfdi.push({'id':'','text':'Primero selecciona tu régimen fiscal','selected':'selected'});
                        break;
                    }
                }
            }
        }
    }


    $("#cfdiuse_field").select2({
        data: uso_cfdi
    })
    if($generico == 1) {
        $("#cfdiuse_field").val("23").trigger("change")
    }
}

function reloadselect(){
    $("#regimen_field").empty();
    $("#regimen_field").select2("destroy");
    objb = JSON.parse(atob(listaregimen));
    var regimenfiscal = [];
    if(regimensaved == '' && $generico == 0){
        regimenfiscal.push({'id':'','text':'-- Selecciona tu régimen fiscal --','selected':'selected'});
        $regimenselected = 0;
    }
    for (x in objb) {
        if($fisica == 1){
            if(objb[x].fisica == 1){
                if(regimensaved == objb[x].key_fiscal){
                    regimenfiscal.push({'id':objb[x].id,'idsat':objb[x].key_fiscal,'text':objb[x].key_fiscal+" - "+objb[x].description,'selected':'selected'});
                    $regimenselected = objb[x].key_fiscal;
                }else{
                    if($generico == 1){
                        if(objb[x].key_fiscal == 616){
                            regimenfiscal.push({'id':objb[x].id,'idsat':objb[x].key_fiscal,'text':objb[x].key_fiscal+" - "+objb[x].description});
                        }
                    }else{
                        regimenfiscal.push({'id':objb[x].id,'idsat':objb[x].key_fiscal,'text':objb[x].key_fiscal+" - "+objb[x].description});
                    }

                }
            }
        }else{
            if(objb[x].moral == 1){
                if(regimensaved == objb[x].key_fiscal){
                    $regimenselected = objb[x].key_fiscal;
                    regimenfiscal.push({'id':objb[x].id,'idsat':objb[x].key_fiscal,'text':objb[x].key_fiscal+" - "+objb[x].description,'selected':'selected'});
                }else{
                    regimenfiscal.push({'id':objb[x].id,'idsat':objb[x].key_fiscal,'text':objb[x].key_fiscal+" - "+objb[x].description});
                }

            }
        }
    }







    $("#regimen_field").select2({
        data: regimenfiscal
    })
    if($generico == 1) {
        $("#regimen_field").val("11").trigger("change")
    }
    reloadcfdiuse();
}

$('#rfc_field').on('input', function() {
    checkrfc();
});


$( "#razon_social" ).keyup(function( event ) {
    /*rz = $("#razon_social").val();
    rz = rz.replace(/[.]/g, '');
    $("#razon_social").val(rz);*/
}).keydown(function( event ) {
    if ( event.which == 13 ) {
        event.preventDefault();
    }
});

function pastedata(){
    checkrfc();
}

function checkrfc(){
    cfdiusesaved = '';
    regimensaved = '';
    $cadena = $("#rfc_field").val();
    $cadena = $cadena.replace(/\s/g, "");
    $cadena = $cadena.replace(/[^a-zA-Z0-9-&-ñ-Ñ]/g,'');
    $cadena = $cadena.replace(/-/g, "");
    $("#rfc_field").val($cadena.toUpperCase());
    if($("#rfc_field").val() == 'XEXX010101000' || $("#rfc_field").val() == 'XAXX010101000'){
        $generico = 1;
    }else{
        $generico = 0;
    }

    if($cadena.length == 12){
        $fisica = 0;
        reloadselect();
    }else if($cadena.length == 13){
        $fisica = 1;
        reloadselect();
    }
}

$( "#rfc_field" ).keyup(function( event ) {
    checkrfc();
}).keydown(function( event ) {
    if ( event.which == 13 ) {
        event.preventDefault();
    }
});
